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

      // Ensure required fields exist in production tables
      await this.ensureRequiredFields();
    } catch (error: any) {
      console.error("❌ Database connection failed:", error.message);
      throw new Error(`Failed to connect to Sage database: ${error.message}`);
    }
  }

  /**
   * Ensure required fields exist in production Sage tables
   * Adds iLines field to InvNum if missing
   */
  private async ensureRequiredFields(): Promise<void> {
    try {
      if (!this.pool) return;

      console.log("🔍 Checking required fields in Sage tables...");

      // Check if iLines column exists in InvNum table
      const columnCheck = await this.pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'InvNum' AND COLUMN_NAME = 'iLines'
      `);

      if (columnCheck.recordset.length === 0) {
        console.log("➕ Adding iLines field to InvNum table...");

        await this.pool.request().query(`
          ALTER TABLE dbo.InvNum 
          ADD iLines int NULL
        `);

        console.log("✅ iLines field added to InvNum table");
      } else {
        console.log("✅ iLines field already exists in InvNum table");
      }
    } catch (error: any) {
      // Non-critical error - log but don't fail connection
      console.warn("⚠️  Could not add iLines field:", error.message);
      console.warn(
        "   This field is optional and can be added manually if needed"
      );
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
   * Insert invoice header into Sage PRODUCTION table
   */
  async insertInvoiceHeader(invoiceHeader: any): Promise<number> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log("💾 Inserting invoice header to dbo.InvNum (PRODUCTION)...");

      const request = this.pool.request();

      // Bind parameters dynamically
      Object.keys(invoiceHeader).forEach((key) => {
        const value = invoiceHeader[key];
        if (value !== undefined && value !== null) {
          if (typeof value === "number") {
            // Use Int for ID fields and counts, Decimal for amounts
            const intFields = [
              "DocType",
              "DocState",
              "AccountID",
              "DelMethodID",
              "DocRepID",
              "ProjectID",
              "TillID",
              "LineCount",
              "iLines",
            ];
            if (intFields.includes(key)) {
              request.input(key, sql.Int, value);
            } else {
              request.input(key, sql.Decimal(18, 2), value);
            }
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
        INSERT INTO dbo.InvNum (${columns})
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
   * Insert invoice line items into Sage PRODUCTION table
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
        `💾 Inserting ${invoiceLines.length} line items to dbo._btblInvoiceLines (PRODUCTION)...`
      );

      for (let i = 0; i < invoiceLines.length; i++) {
        const line = { ...invoiceLines[i], iInvoiceID: invoiceId };
        const request = this.pool.request();

        // Bind parameters dynamically
        Object.keys(line).forEach((key) => {
          const value = line[key];
          if (value !== undefined && value !== null) {
            if (typeof value === "number") {
              // Use Int for ID fields, Decimal for amounts/quantities
              const intFields = [
                "iStockCodeID",
                "iTaxTypeID",
                "iWarehouseID",
                "iLineID",
                "iInvoiceID",
              ];
              if (intFields.includes(key)) {
                request.input(key, sql.Int, value);
              } else {
                request.input(key, sql.Decimal(18, 2), value);
              }
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

        const query = `INSERT INTO dbo._btblInvoiceLines (${columns}) VALUES (${params})`;

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
          "SELECT COUNT(*) AS Count FROM dbo.InvNum WHERE OrderNum = @orderNum"
        );

      return result.recordset[0].Count > 0;
    } catch (error: any) {
      console.error("❌ Error checking order existence:", error.message);
      return false; // Assume doesn't exist on error
    }
  }

  /**
   * Get database statistics from PRODUCTION tables
   */
  async getStats(): Promise<{
    totalInvoices: number;
    totalLineItems: number;
    lastInvoiceDate?: Date;
    productionTablesExist: boolean;
  }> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      // Check if production tables exist
      const tablesCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME IN ('InvNum', '_btblInvoiceLines')
      `);

      const existingTables = tablesCheck.recordset.map(
        (row: any) => row.TABLE_NAME
      );
      const productionTablesExist =
        existingTables.includes("InvNum") &&
        existingTables.includes("_btblInvoiceLines");

      if (!productionTablesExist) {
        console.log("ℹ️ Production tables not found");
        return {
          totalInvoices: 0,
          totalLineItems: 0,
          productionTablesExist: false,
        };
      }

      // Query production tables
      const invoiceCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo.InvNum");

      const lineCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo._btblInvoiceLines");

      const lastInvoiceResult = await this.pool
        .request()
        .query("SELECT TOP 1 InvDate FROM dbo.InvNum ORDER BY AutoIndex DESC");

      return {
        totalInvoices: invoiceCountResult.recordset[0].Count,
        totalLineItems: lineCountResult.recordset[0].Count,
        lastInvoiceDate: lastInvoiceResult.recordset[0]?.InvDate,
        productionTablesExist: true,
      };
    } catch (error: any) {
      console.error("❌ Error getting database stats:", error.message);
      return {
        totalInvoices: 0,
        totalLineItems: 0,
        productionTablesExist: false,
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
   * Execute raw SQL query
   */
  async executeQuery(query: string): Promise<any> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      const result = await this.pool.request().query(query);
      return result;
    } catch (error: any) {
      console.error("❌ Query execution failed:", error.message);
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  /**
   * Delete ALL BETA test data and tables (PRODUCTION CLEANUP)
   * This removes all X-suffix tables and prepares for live deployment
   */
  async deleteAllBetaData(): Promise<{
    deleted: boolean;
    message: string;
    details: any;
  }> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log("🚨 PRODUCTION CLEANUP - Deleting ALL BETA data...");
      const results = {
        betaTablesDeleted: [] as string[],
        errors: [] as string[],
      };

      // Find all tables with X suffix (BETA tables)
      const tablesCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE '%X' AND TABLE_SCHEMA = 'dbo'
      `);

      const betaTables = tablesCheck.recordset.map(
        (row: any) => row.TABLE_NAME
      );

      console.log(
        `📋 Found BETA tables to delete: ${betaTables.join(", ") || "None"}`
      );

      if (betaTables.length === 0) {
        return {
          deleted: false,
          message: "ℹ️ No BETA tables found - database is already clean",
          details: { betaTablesDeleted: [], errors: [] },
        };
      }

      // Delete each BETA table
      for (const tableName of betaTables) {
        try {
          console.log(`🗑️ Dropping ${tableName}...`);
          await this.pool.request().query(`
            DROP TABLE IF EXISTS dbo.${tableName}
          `);
          results.betaTablesDeleted.push(tableName);
          console.log(`✅ ${tableName} deleted`);
        } catch (error: any) {
          results.errors.push(`${tableName}: ${error.message}`);
          console.error(`❌ Error deleting ${tableName}:`, error.message);
        }
      }

      // Verify cleanup
      const verifyCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE '%X' AND TABLE_SCHEMA = 'dbo'
      `);

      const stillExists = verifyCheck.recordset.map(
        (row: any) => row.TABLE_NAME
      );

      const message =
        stillExists.length === 0
          ? `✅ ALL BETA data removed! Deleted ${results.betaTablesDeleted.length} table(s). Database ready for production.`
          : `⚠️ Some tables still exist: ${stillExists.join(", ")}`;

      console.log(message);

      return {
        deleted: results.betaTablesDeleted.length > 0,
        message,
        details: {
          betaTablesDeleted: results.betaTablesDeleted,
          stillExists,
          errors: results.errors,
        },
      };
    } catch (error: any) {
      console.error("❌ Failed to delete BETA data:", error.message);
      return {
        deleted: false,
        message: `❌ BETA cleanup failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Get invoice headers for database viewer (PRODUCTION)
   * Only shows latest 50 records where iLines > 0 (orders from OdaFlow)
   */
  async getInvoices(): Promise<any[]> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      // Check if production table exists
      const tableCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvNum'
      `);

      if (tableCheck.recordset.length === 0) {
        console.log("ℹ️ InvNum table doesn't exist");
        return [];
      }

      // Only show invoices with iLines > 0 (our OdaFlow orders)
      const result = await this.pool.request().query(`
          SELECT TOP 50 
            AutoIndex, OrderNum, AccountID, InvDate, 
            InvTotIncl, InvTotExcl, InvTotTax, iLines,
            Address1, Address2, Address3, Description
          FROM dbo.InvNum 
          WHERE iLines IS NOT NULL AND iLines > 0
          ORDER BY AutoIndex DESC
        `);

      return result.recordset;
    } catch (error: any) {
      console.error("❌ Error fetching invoices:", error.message);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get invoice line items for database viewer (PRODUCTION)
   * Only shows line items for the latest 50 invoices with iLines > 0 (orders from OdaFlow)
   */
  async getInvoiceLines(): Promise<any[]> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      // Check if production table exists
      const tableCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '_btblInvoiceLines'
      `);

      if (tableCheck.recordset.length === 0) {
        console.log("ℹ️ _btblInvoiceLines table doesn't exist");
        return [];
      }

      // Get line items only for the latest 50 OdaFlow invoices
      const result = await this.pool.request().query(`
          SELECT 
            l.idInvoiceLines, l.iInvoiceID, l.cDescription, l.fQuantity, 
            l.fUnitPriceIncl, l.fQuantityLineTotIncl, 
            l.iStockCodeID, l.fTaxRate, l.iTaxTypeID, l.iLineID
          FROM dbo._btblInvoiceLines l
          WHERE l.iInvoiceID IN (
            SELECT TOP 50 AutoIndex 
            FROM dbo.InvNum 
            WHERE iLines IS NOT NULL AND iLines > 0
            ORDER BY AutoIndex DESC
          )
          ORDER BY l.iInvoiceID DESC, l.iLineID ASC
        `);

      return result.recordset;
    } catch (error: any) {
      console.error("❌ Error fetching invoice lines:", error.message);
      return []; // Return empty array instead of throwing
    }
  }
}
