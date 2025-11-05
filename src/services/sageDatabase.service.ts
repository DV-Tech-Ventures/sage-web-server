import sql, { ConnectionPool } from "mssql";
import {
  DatabaseConfig,
  toMssqlConfig,
  validateDatabaseConfig,
} from "../config/database.config";

/**
 * Sage Database Service
 * Handles connection and operations with Sage SQL Server
 */
export class SageDatabaseService {
  private pool: ConnectionPool | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      // Validate configuration
      const validation = validateDatabaseConfig(this.config);
      if (!validation.valid) {
        throw new Error(
          `Database configuration invalid: ${validation.errors.join(", ")}`
        );
      }

      console.log("🔌 Connecting to Sage database...");
      console.log(
        `   Server: ${this.config.server}:${this.config.port || 1433}`
      );
      console.log(`   Database: ${this.config.database}`);
      console.log(`   User: ${this.config.username}`);

      const mssqlConfig = toMssqlConfig(this.config);
      this.pool = await new sql.ConnectionPool(mssqlConfig).connect();

      console.log("✅ Connected to Sage database successfully");
    } catch (error: any) {
      console.error("❌ Database connection failed:", error.message);
      throw new Error(`Failed to connect to Sage database: ${error.message}`);
    }
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const result = await this.pool!.request().query(
        "SELECT 1 AS TestConnection"
      );
      return result.recordset.length > 0;
    } catch (error: any) {
      console.error("❌ Connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Insert invoice header into Sage
   */
  async insertInvoiceHeader(invoiceHeader: any): Promise<number> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log("💾 Inserting invoice header to dbo.InvNumX (BETA mode)...");

      const request = this.pool.request();

      // Bind parameters dynamically
      Object.keys(invoiceHeader).forEach((key) => {
        const value = invoiceHeader[key];
        if (value !== undefined && value !== null) {
          if (typeof value === "number") {
            request.input(key, sql.Decimal(18, 2), value);
          } else if (typeof value === "boolean") {
            request.input(key, sql.Bit, value);
          } else if (value instanceof Date) {
            request.input(key, sql.DateTime, value);
          } else {
            request.input(key, sql.NVarChar, String(value));
          }
        }
      });

      // Build dynamic INSERT query
      const columns = Object.keys(invoiceHeader)
        .filter(
          (key) =>
            invoiceHeader[key] !== undefined && invoiceHeader[key] !== null
        )
        .join(", ");

      const params = Object.keys(invoiceHeader)
        .filter(
          (key) =>
            invoiceHeader[key] !== undefined && invoiceHeader[key] !== null
        )
        .map((k) => `@${k}`)
        .join(", ");

      const query = `
        INSERT INTO dbo.InvNumX (${columns})
        OUTPUT INSERTED.AutoIndex
        VALUES (${params})
      `;

      console.log(
        `   📝 Inserting fields: ${Object.keys(invoiceHeader).join(", ")}`
      );

      const result = await request.query(query);
      const autoIndex = result.recordset[0].AutoIndex;

      console.log(`   ✅ Invoice header inserted with AutoIndex: ${autoIndex}`);
      return autoIndex;
    } catch (error: any) {
      console.error("❌ Failed to insert invoice header:", error.message);
      throw new Error(`Invoice header insertion failed: ${error.message}`);
    }
  }

  /**
   * Insert invoice line items into Sage
   */
  async insertInvoiceLines(
    invoiceLines: any[],
    invoiceId: number
  ): Promise<void> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log(
        `💾 Inserting ${invoiceLines.length} line items to dbo.btblInvoiceLinesX (BETA mode)...`
      );

      for (let i = 0; i < invoiceLines.length; i++) {
        const line = { ...invoiceLines[i], iInvoiceID: invoiceId };
        const request = this.pool.request();

        // Bind parameters dynamically
        Object.keys(line).forEach((key) => {
          const value = line[key];
          if (value !== undefined && value !== null) {
            if (typeof value === "number") {
              request.input(key, sql.Decimal(18, 2), value);
            } else if (typeof value === "boolean") {
              request.input(key, sql.Bit, value);
            } else if (value instanceof Date) {
              request.input(key, sql.DateTime, value);
            } else {
              request.input(key, sql.NVarChar, String(value));
            }
          }
        });

        // Build dynamic INSERT query
        const columns = Object.keys(line)
          .filter((key) => line[key] !== undefined && line[key] !== null)
          .join(", ");

        const params = Object.keys(line)
          .filter((key) => line[key] !== undefined && line[key] !== null)
          .map((k) => `@${k}`)
          .join(", ");

        const query = `INSERT INTO dbo.btblInvoiceLinesX (${columns}) VALUES (${params})`;

        await request.query(query);
        console.log(`   ✅ Line ${i + 1} inserted: ${line.cDescription}`);
      }

      console.log(
        `   ✅ All ${invoiceLines.length} line items inserted successfully`
      );
    } catch (error: any) {
      console.error("❌ Failed to insert invoice lines:", error.message);
      throw new Error(`Invoice lines insertion failed: ${error.message}`);
    }
  }

  /**
   * Check if order already exists (for duplicate detection)
   */
  async orderExists(orderNumber: string): Promise<boolean> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      const result = await this.pool
        .request()
        .input("orderNum", sql.NVarChar, orderNumber)
        .query(
          "SELECT COUNT(*) AS Count FROM dbo.InvNumX WHERE OrderNumX = @orderNum"
        );

      return result.recordset[0].Count > 0;
    } catch (error: any) {
      console.error("❌ Error checking order existence:", error.message);
      return false; // Assume doesn't exist on error
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalInvoices: number;
    totalLineItems: number;
    lastInvoiceDate?: Date;
  }> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      const invoiceCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo.InvNumX");

      const lineCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo.btblInvoiceLinesX");

      const lastInvoiceResult = await this.pool
        .request()
        .query(
          "SELECT TOP 1 InvDateX FROM dbo.InvNumX ORDER BY AutoIndex DESC"
        );

      return {
        totalInvoices: invoiceCountResult.recordset[0].Count,
        totalLineItems: lineCountResult.recordset[0].Count,
        lastInvoiceDate: lastInvoiceResult.recordset[0]?.InvDateX,
      };
    } catch (error: any) {
      console.error("❌ Error getting database stats:", error.message);
      return {
        totalInvoices: 0,
        totalLineItems: 0,
      };
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        console.log("🔌 Disconnected from Sage database");
      }
    } catch (error: any) {
      console.error("❌ Error disconnecting from database:", error.message);
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.pool?.connected || false;
  }

  /**
   * Create BETA tables with X suffix for safe testing
   */
  async createBetaTables(): Promise<void> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log("🧪 Creating BETA tables with X suffix...");

      // Create BETA invoice header table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvNumX')
        BEGIN
          CREATE TABLE dbo.InvNumX (
            AutoIndex int IDENTITY(1,1) PRIMARY KEY,
            DocTypeX int NOT NULL DEFAULT 4,
            DocStateX int NOT NULL DEFAULT 1,
            AccountIDX int NOT NULL,
            DescriptionX nvarchar(255) DEFAULT 'Sales Order',
            InvDateX datetime NOT NULL,
            OrderDateX datetime,
            DueDateX datetime,
            DeliveryDateX datetime,
            TaxInclusiveX bit DEFAULT 1,
            Address1X nvarchar(100),
            Address2X nvarchar(100),
            Address3X nvarchar(100),
            Address4X nvarchar(100),
            OrderNumX nvarchar(50) NOT NULL UNIQUE,
            ExtOrderNumX nvarchar(50),
            InvTotInclX decimal(18,2),
            InvTotExclX decimal(18,2), 
            InvTotTaxX decimal(18,2),
            OrdTotInclX decimal(18,2),
            OrdTotExclX decimal(18,2),
            OrdTotTaxX decimal(18,2)
          );
          PRINT 'Created dbo.InvNumX table';
        END
        ELSE
        BEGIN
          PRINT 'dbo.InvNumX table already exists';
        END
      `);

      // Create BETA invoice lines table
      await this.pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'btblInvoiceLinesX')
        BEGIN
          CREATE TABLE dbo.btblInvoiceLinesX (
            LineID int IDENTITY(1,1) PRIMARY KEY,
            iInvoiceID int NOT NULL,
            cDescriptionX nvarchar(255),
            fQuantityX decimal(18,2),
            fQtyToProcessX decimal(18,2),
            fUnitPriceExclzDefaultX decimal(18,2),
            fUnitPriceInclzDefaultX decimal(18,2),
            fTaxRateX decimal(18,2),
            iStockCodeIDX int,
            iTaxTypeIDX int DEFAULT 3,
            iWarehouseIDX int DEFAULT 1,
            bIsWhseItemX bit DEFAULT 1,
            fQuantityLineTotExclX decimal(18,2),
            fQuantityLineTotInclX decimal(18,2),
            fQuantityLineTaxAmountX decimal(18,2),
            iLineIDX int,
            FOREIGN KEY (iInvoiceID) REFERENCES dbo.InvNumX(AutoIndex)
          );
          PRINT 'Created dbo.btblInvoiceLinesX table';
        END
        ELSE
        BEGIN
          PRINT 'dbo.btblInvoiceLinesX table already exists';
        END
      `);

      console.log("✅ BETA tables ready for testing");
    } catch (error: any) {
      console.error("❌ Failed to create BETA tables:", error.message);
      throw new Error(`BETA table creation failed: ${error.message}`);
    }
  }

  /**
   * Get invoice headers for database viewer
   */
  async getInvoices(): Promise<any[]> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      const result = await this.pool.request().query(`
          SELECT TOP 100 
            AutoIndex, OrderNumX, AccountIDX, InvDateX, 
            InvTotInclX, InvTotExclX, InvTotTaxX,
            Address1X, Address2X, Address3X, DescriptionX
          FROM dbo.InvNumX 
          ORDER BY AutoIndex DESC
        `);

      return result.recordset;
    } catch (error: any) {
      console.error("❌ Error fetching invoices:", error.message);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
  }

  /**
   * Get invoice line items for database viewer
   */
  async getInvoiceLines(): Promise<any[]> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      const result = await this.pool.request().query(`
          SELECT TOP 100 
            LineID, iInvoiceID, cDescriptionX, fQuantityX, 
            fUnitPriceInclzDefaultX, fQuantityLineTotInclX, 
            iStockCodeIDX, fTaxRateX, iLineIDX
          FROM dbo.btblInvoiceLinesX 
          ORDER BY LineID DESC
        `);

      return result.recordset;
    } catch (error: any) {
      console.error("❌ Error fetching invoice lines:", error.message);
      throw new Error(`Failed to fetch invoice lines: ${error.message}`);
    }
  }
}
