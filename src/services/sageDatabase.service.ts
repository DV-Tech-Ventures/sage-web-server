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
   * Ensure X-suffixed tables exist and have all required fields
   * Creates InvNumX and _btblInvoiceLinesX if they don't exist
   */
  private async ensureRequiredFields(): Promise<void> {
    try {
      if (!this.pool) return;

      console.log(
        "🔍 Checking X-suffixed tables (InvNumX, _btblInvoiceLinesX)..."
      );

      // Check if InvNumX table exists
      const invNumXCheck = await this.pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'InvNumX' AND TABLE_SCHEMA = 'dbo'
      `);

      if (invNumXCheck.recordset.length === 0) {
        console.log("➕ Creating InvNumX table...");
        await this.createInvNumXTable();
      } else {
        console.log("✅ InvNumX table already exists");
        // Ensure iLines field exists
        await this.ensureInvNumXFields();
      }

      // Check if _btblInvoiceLinesX table exists
      const linesXCheck = await this.pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = '_btblInvoiceLinesX' AND TABLE_SCHEMA = 'dbo'
      `);

      if (linesXCheck.recordset.length === 0) {
        console.log("➕ Creating _btblInvoiceLinesX table...");
        await this.createInvoiceLinesXTable();
      } else {
        console.log("✅ _btblInvoiceLinesX table already exists");
        // Ensure all required fields exist
        await this.ensureInvoiceLinesXFields();
      }
    } catch (error: any) {
      // Non-critical error - log but don't fail connection
      console.warn("⚠️  Could not ensure X-suffixed tables:", error.message);
      console.warn("   Tables will be created on first insert if needed");
    }
  }

  /**
   * Create InvNumX table with all required fields
   */
  private async createInvNumXTable(): Promise<void> {
    if (!this.pool) return;

    await this.pool.request().query(`
      CREATE TABLE dbo.InvNumX (
        AutoIndex int IDENTITY(1,1) PRIMARY KEY,
        DocType int NOT NULL DEFAULT 4,
        DocState int NOT NULL DEFAULT 1,
        AccountID int NOT NULL,
        OrderNum nvarchar(50) NULL,
        ExtOrderNum nvarchar(50) NULL,
        InvNumber nvarchar(50) NULL,
        Description nvarchar(255) NULL,
        InvDate datetime NULL,
        OrderDate datetime NULL,
        DueDate datetime NULL,
        DeliveryDate datetime NULL,
        TaxInclusive bit NOT NULL DEFAULT 0,
        Address1 nvarchar(255) NULL,
        Address2 nvarchar(255) NULL,
        Address3 nvarchar(255) NULL,
        Address4 nvarchar(255) NULL,
        Address5 nvarchar(255) NULL,
        Address6 nvarchar(255) NULL,
        InvTotExcl decimal(18,2) NOT NULL DEFAULT 0,
        InvTotTax decimal(18,2) NOT NULL DEFAULT 0,
        InvTotIncl decimal(18,2) NOT NULL DEFAULT 0,
        OrdTotExcl decimal(18,2) NOT NULL DEFAULT 0,
        OrdTotTax decimal(18,2) NOT NULL DEFAULT 0,
        OrdTotIncl decimal(18,2) NOT NULL DEFAULT 0,
        InvDisc decimal(18,2) NULL DEFAULT 0,
        InvDiscAmnt decimal(18,2) NULL DEFAULT 0,
        iLines int NULL,
        DelMethodID int NULL,
        DocRepID int NULL,
        ProjectID int NULL,
        TillID int NULL,
        LineCount int NULL,
        DeliveryNote nvarchar(255) NULL,
        GrvNumber nvarchar(255) NULL,
        GrvID int NULL DEFAULT 0,
        OrigDocID int NULL DEFAULT 0,
        DocVersion int NULL DEFAULT 2,
        DocFlag int NULL DEFAULT 0,
        Email_Sent int NULL DEFAULT 0
      )
    `);
    console.log("✅ InvNumX table created successfully");
  }

  /**
   * Ensure all required fields exist in InvNumX
   */
  private async ensureInvNumXFields(): Promise<void> {
    if (!this.pool) return;

    const requiredFields = [
      { name: "InvNumber", type: "nvarchar(50)", nullable: "NULL" },
      { name: "Address5", type: "nvarchar(255)", nullable: "NULL" },
      { name: "Address6", type: "nvarchar(255)", nullable: "NULL" },
      { name: "InvDisc", type: "decimal(18,2)", nullable: "NULL DEFAULT 0" },
      {
        name: "InvDiscAmnt",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      { name: "iLines", type: "int", nullable: "NULL" },
      { name: "DeliveryNote", type: "nvarchar(255)", nullable: "NULL" },
      { name: "GrvNumber", type: "nvarchar(255)", nullable: "NULL" },
      { name: "GrvID", type: "int", nullable: "NULL DEFAULT 0" },
      { name: "OrigDocID", type: "int", nullable: "NULL DEFAULT 0" },
      { name: "DocVersion", type: "int", nullable: "NULL DEFAULT 2" },
      { name: "DocFlag", type: "int", nullable: "NULL DEFAULT 0" },
      { name: "Email_Sent", type: "int", nullable: "NULL DEFAULT 0" },
    ];

    for (const field of requiredFields) {
      const columnCheck = await this.pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'InvNumX' AND COLUMN_NAME = '${field.name}'
      `);

      if (columnCheck.recordset.length === 0) {
        await this.pool.request().query(`
          ALTER TABLE dbo.InvNumX 
          ADD ${field.name} ${field.type} ${field.nullable}
        `);
        console.log(`   ✅ Added ${field.name} field to InvNumX`);
      }
    }
  }

  /**
   * Create _btblInvoiceLinesX table with all required fields
   */
  private async createInvoiceLinesXTable(): Promise<void> {
    if (!this.pool) return;

    await this.pool.request().query(`
      CREATE TABLE dbo._btblInvoiceLinesX (
        idInvoiceLines int IDENTITY(1,1) PRIMARY KEY,
        iInvoiceID int NOT NULL,
        iLineID int NOT NULL,
        cDescription nvarchar(255) NOT NULL,
        fQuantity decimal(18,2) NOT NULL,
        fQtyToProcess decimal(18,2) NULL DEFAULT 0,
        fQtyLastProcess decimal(18,2) NULL DEFAULT 0,
        fQtyProcessed decimal(18,2) NULL DEFAULT 0,
        fQtyReserved decimal(18,2) NULL DEFAULT 0,
        fQtyReservedChange decimal(18,2) NULL DEFAULT 0,
        fQtyChange decimal(18,2) NULL DEFAULT 0,
        cLineNotes nvarchar(500) NULL,
        fUnitPriceExcl decimal(18,2) NOT NULL,
        fUnitPriceIncl decimal(18,2) NOT NULL,
        fUnitCost decimal(18,2) NULL,
        fLineDiscount decimal(18,2) NULL DEFAULT 0,
        fTaxRate decimal(18,2) NOT NULL DEFAULT 0,
        iStockCodeID int NOT NULL,
        iWarehouseID int NULL DEFAULT 1,
        iTaxTypeID int NOT NULL DEFAULT 12,
        iPriceListNameID int NULL DEFAULT 1,
        iJobID int NULL DEFAULT 0,
        bIsWhseItem bit NULL DEFAULT 1,
        bIsSerialItem bit NULL DEFAULT 0,
        bIsLotItem bit NULL DEFAULT 0,
        fQuantityLineTotExcl decimal(18,2) NOT NULL,
        fQuantityLineTotIncl decimal(18,2) NOT NULL,
        fQuantityLineTotExclNoDisc decimal(18,2) NULL,
        fQuantityLineTotInclNoDisc decimal(18,2) NULL,
        fQuantityLineTaxAmount decimal(18,2) NULL DEFAULT 0,
        fQuantityLineTaxAmountNoDisc decimal(18,2) NULL DEFAULT 0,
        fAddCost decimal(18,2) NULL DEFAULT 0,
        fUnitPriceExclzDefault decimal(18,2) NULL,
        fUnitPriceInclzDefault decimal(18,2) NULL,
        fUnitCostExcl decimal(18,2) NULL,
        fUnitCostIncl decimal(18,2) NULL,
        iLineDiscountReasonID int NULL,
        iReturnReasonID int NULL,
        cTradeinItem nvarchar(255) NULL
      )
    `);
    console.log("✅ _btblInvoiceLinesX table created successfully");
  }

  /**
   * Ensure all required fields exist in _btblInvoiceLinesX
   */
  private async ensureInvoiceLinesXFields(): Promise<void> {
    if (!this.pool) return;

    const requiredFields = [
      {
        name: "fQtyToProcess",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fQtyLastProcess",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fQtyProcessed",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fQtyReserved",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fQtyReservedChange",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      { name: "fQtyChange", type: "decimal(18,2)", nullable: "NULL DEFAULT 0" },
      { name: "cLineNotes", type: "nvarchar(500)", nullable: "NULL" },
      { name: "fUnitCost", type: "decimal(18,2)", nullable: "NULL" },
      {
        name: "fLineDiscount",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      { name: "iPriceListNameID", type: "int", nullable: "NULL DEFAULT 1" },
      { name: "iJobID", type: "int", nullable: "NULL DEFAULT 0" },
      { name: "bIsWhseItem", type: "bit", nullable: "NULL DEFAULT 1" },
      { name: "bIsSerialItem", type: "bit", nullable: "NULL DEFAULT 0" },
      { name: "bIsLotItem", type: "bit", nullable: "NULL DEFAULT 0" },
      {
        name: "fQuantityLineTotExclNoDisc",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "fQuantityLineTotInclNoDisc",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "fQuantityLineTaxAmount",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fQuantityLineTaxAmountNoDisc",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fAddCost",
        type: "decimal(18,2)",
        nullable: "NULL DEFAULT 0",
      },
      {
        name: "fUnitPriceExclzDefault",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "fUnitPriceInclzDefault",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "fUnitCostExcl",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "fUnitCostIncl",
        type: "decimal(18,2)",
        nullable: "NULL",
      },
      {
        name: "iLineDiscountReasonID",
        type: "int",
        nullable: "NULL",
      },
      {
        name: "iReturnReasonID",
        type: "int",
        nullable: "NULL",
      },
      {
        name: "cTradeinItem",
        type: "nvarchar(255)",
        nullable: "NULL",
      },
    ];

    for (const field of requiredFields) {
      const columnCheck = await this.pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '_btblInvoiceLinesX' AND COLUMN_NAME = '${field.name}'
      `);

      if (columnCheck.recordset.length === 0) {
        await this.pool.request().query(`
          ALTER TABLE dbo._btblInvoiceLinesX 
          ADD ${field.name} ${field.type} ${field.nullable}
        `);
        console.log(`   ✅ Added ${field.name} field to _btblInvoiceLinesX`);
      }
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

      console.log("💾 Inserting invoice header to dbo.InvNumX...");

      // Ensure table exists before insert
      await this.ensureInvNumXTableExists();

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

      // Always include Address fields even if empty (to ensure they're in the INSERT)
      // This ensures addresses are stored even if they're empty strings
      const addressFields = [
        "Address1",
        "Address2",
        "Address3",
        "Address4",
        "Address5",
        "Address6",
      ];
      addressFields.forEach((field) => {
        if (!(field in invoiceHeader)) {
          invoiceHeader[field] = ""; // Set to empty string if not present
        }
      });

      // Build dynamic INSERT query
      // Include all fields, even empty strings (they'll be stored as empty strings, not NULL)
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

      // Log address fields for debugging
      console.log(
        `   📍 Address fields for order ${invoiceHeader.OrderNum}: Address1="${
          invoiceHeader.Address1 || ""
        }", Address2="${invoiceHeader.Address2 || ""}", Address3="${
          invoiceHeader.Address3 || ""
        }", Address4="${invoiceHeader.Address4 || ""}", Address5="${
          invoiceHeader.Address5 || ""
        }", Address6="${invoiceHeader.Address6 || ""}"`
      );

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
      // Check if error is due to missing column
      if (error.message && error.message.includes("Invalid column name")) {
        const columnMatch = error.message.match(
          /Invalid column name '([^']+)'/
        );
        if (columnMatch && columnMatch[1]) {
          const missingColumn = columnMatch[1];
          console.log(
            `⚠️  Missing column detected: ${missingColumn}, attempting to add...`
          );

          try {
            // First check if column already exists (avoid duplicate column error)
            const columnCheck = await this.pool!.request().query(`
              SELECT COLUMN_NAME 
              FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME = 'InvNumX' AND COLUMN_NAME = '${missingColumn}'
            `);

            if (columnCheck.recordset.length > 0) {
              console.log(
                `ℹ️  Column ${missingColumn} already exists in InvNumX, skipping add`
              );
            } else {
              // Try to add the missing column (as decimal for amounts, nvarchar for strings)
              const isAmountField =
                missingColumn.toLowerCase().includes("amt") ||
                missingColumn.toLowerCase().includes("tot") ||
                missingColumn.toLowerCase().includes("disc") ||
                missingColumn.toLowerCase().includes("price") ||
                missingColumn.toLowerCase().includes("cost");

              const columnType = isAmountField
                ? "decimal(18,2)"
                : "nvarchar(255)";
              const nullable = isAmountField ? "NULL DEFAULT 0" : "NULL";

              await this.pool!.request().query(`
                ALTER TABLE dbo.InvNumX 
                ADD ${missingColumn} ${columnType} ${nullable}
              `);

              console.log(
                `✅ Added missing column ${missingColumn} to InvNumX`
              );
            }

            // Retry the insert
            return await this.insertInvoiceHeader(invoiceHeader);
          } catch (addColumnError: any) {
            console.error(
              `❌ Failed to add column ${missingColumn}:`,
              addColumnError.message
            );
            throw new Error(
              `Invoice header insertion failed: Missing column '${missingColumn}' and could not add it automatically`
            );
          }
        }
      }

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
        `💾 Inserting ${invoiceLines.length} line items to dbo._btblInvoiceLinesX...`
      );

      // Ensure table exists before insert
      await this.ensureInvoiceLinesXTableExists();

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

        const query = `INSERT INTO dbo._btblInvoiceLinesX (${columns}) VALUES (${params})`;

        try {
          await request.query(query);
          console.log(`   ✅ Line ${i + 1} inserted: ${line.cDescription}`);
        } catch (lineError: any) {
          // Check if error is due to missing column
          if (
            lineError.message &&
            lineError.message.includes("Invalid column name")
          ) {
            const columnMatch = lineError.message.match(
              /Invalid column name '([^']+)'/
            );
            if (columnMatch && columnMatch[1]) {
              const missingColumn = columnMatch[1];
              console.log(
                `⚠️  Missing column detected: ${missingColumn}, attempting to add...`
              );

              try {
                // First check if column already exists (avoid duplicate column error)
                const columnCheck = await this.pool!.request().query(`
                  SELECT COLUMN_NAME 
                  FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_NAME = '_btblInvoiceLinesX' AND COLUMN_NAME = '${missingColumn}'
                `);

                if (columnCheck.recordset.length > 0) {
                  console.log(
                    `ℹ️  Column ${missingColumn} already exists in _btblInvoiceLinesX, skipping add`
                  );
                } else {
                  // Try to add the missing column
                  const isAmountField =
                    missingColumn.toLowerCase().includes("amt") ||
                    missingColumn.toLowerCase().includes("tot") ||
                    missingColumn.toLowerCase().includes("disc") ||
                    missingColumn.toLowerCase().includes("price") ||
                    missingColumn.toLowerCase().includes("cost") ||
                    missingColumn.toLowerCase().includes("qty") ||
                    missingColumn.toLowerCase().includes("rate");

                  const isIntField =
                    missingColumn.toLowerCase().includes("id") &&
                    !missingColumn.toLowerCase().includes("price");

                  let columnType: string;
                  let nullable: string;

                  if (isIntField) {
                    columnType = "int";
                    nullable = "NULL DEFAULT 0";
                  } else if (isAmountField) {
                    columnType = "decimal(18,2)";
                    nullable = "NULL DEFAULT 0";
                  } else {
                    columnType = "nvarchar(255)";
                    nullable = "NULL";
                  }

                  await this.pool!.request().query(`
                    ALTER TABLE dbo._btblInvoiceLinesX 
                    ADD ${missingColumn} ${columnType} ${nullable}
                  `);

                  console.log(
                    `✅ Added missing column ${missingColumn} to _btblInvoiceLinesX`
                  );
                }

                // Retry this line by creating a new request
                const retryRequest = this.pool.request();
                Object.keys(line).forEach((key) => {
                  const value = line[key];
                  if (value !== undefined && value !== null) {
                    if (typeof value === "number") {
                      const intFields = [
                        "iStockCodeID",
                        "iTaxTypeID",
                        "iWarehouseID",
                        "iLineID",
                        "iInvoiceID",
                      ];
                      if (intFields.includes(key)) {
                        retryRequest.input(key, sql.Int, value);
                      } else {
                        retryRequest.input(key, sql.Decimal(18, 2), value);
                      }
                    } else if (typeof value === "boolean") {
                      retryRequest.input(key, sql.Bit, value);
                    } else if (value instanceof Date) {
                      retryRequest.input(key, sql.DateTime, value);
                    } else {
                      retryRequest.input(key, sql.NVarChar, String(value));
                    }
                  }
                });
                await retryRequest.query(query);
                console.log(
                  `   ✅ Line ${i + 1} inserted (retry): ${line.cDescription}`
                );
              } catch (addColumnError: any) {
                console.error(
                  `❌ Failed to add column ${missingColumn}:`,
                  addColumnError.message
                );
                throw new Error(
                  `Invoice lines insertion failed: Missing column '${missingColumn}' and could not add it automatically`
                );
              }
            } else {
              throw lineError;
            }
          } else {
            throw lineError;
          }
        }
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
          "SELECT COUNT(*) AS Count FROM dbo.InvNumX WHERE OrderNum = @orderNum"
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

      // Check if X-suffixed tables exist
      const tablesCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME IN ('InvNumX', '_btblInvoiceLinesX')
      `);

      const existingTables = tablesCheck.recordset.map(
        (row: any) => row.TABLE_NAME
      );
      const productionTablesExist =
        existingTables.includes("InvNumX") &&
        existingTables.includes("_btblInvoiceLinesX");

      if (!productionTablesExist) {
        console.log("ℹ️ X-suffixed tables not found");
        return {
          totalInvoices: 0,
          totalLineItems: 0,
          productionTablesExist: false,
        };
      }

      // Query X-suffixed tables
      const invoiceCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo.InvNumX");

      const lineCountResult = await this.pool
        .request()
        .query("SELECT COUNT(*) AS Count FROM dbo._btblInvoiceLinesX");

      const lastInvoiceResult = await this.pool
        .request()
        .query("SELECT TOP 1 InvDate FROM dbo.InvNumX ORDER BY AutoIndex DESC");

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

      // Check if X-suffixed table exists
      const tableCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvNumX'
      `);

      if (tableCheck.recordset.length === 0) {
        console.log("ℹ️ InvNumX table doesn't exist");
        return [];
      }

      // Only show invoices with iLines > 0 (our OdaFlow orders)
      const result = await this.pool.request().query(`
          SELECT TOP 50 
            AutoIndex, OrderNum, AccountID, InvDate, 
            InvTotIncl, InvTotExcl, InvTotTax, iLines,
            Address1, Address2, Address3, Address4, Address5, Address6, Description
          FROM dbo.InvNumX 
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
   * Ensure InvNumX table exists (helper method)
   */
  private async ensureInvNumXTableExists(): Promise<void> {
    if (!this.pool) return;

    const tableCheck = await this.pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'InvNumX' AND TABLE_SCHEMA = 'dbo'
    `);

    if (tableCheck.recordset.length === 0) {
      await this.createInvNumXTable();
    }
  }

  /**
   * Ensure _btblInvoiceLinesX table exists (helper method)
   */
  private async ensureInvoiceLinesXTableExists(): Promise<void> {
    if (!this.pool) return;

    const tableCheck = await this.pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = '_btblInvoiceLinesX' AND TABLE_SCHEMA = 'dbo'
    `);

    if (tableCheck.recordset.length === 0) {
      await this.createInvoiceLinesXTable();
    }
  }

  /**
   * Delete orphaned invoices (invoices with iLines > 0 but no corresponding line items)
   * Returns count of deleted invoices
   */
  async deleteOrphanedInvoices(): Promise<{
    deleted: boolean;
    count: number;
    message: string;
    invoiceIds: number[];
  }> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log(
        "🔍 Finding orphaned invoices (iLines > 0 but no line items)..."
      );

      // Find invoices with iLines > 0 that have no corresponding line items
      const orphanedQuery = await this.pool.request().query(`
        SELECT h.AutoIndex, h.OrderNum, h.iLines
        FROM dbo.InvNumX h
        WHERE h.iLines IS NOT NULL 
          AND h.iLines > 0
          AND NOT EXISTS (
            SELECT 1 
            FROM dbo._btblInvoiceLinesX l 
            WHERE l.iInvoiceID = h.AutoIndex
          )
      `);

      const orphanedInvoices = orphanedQuery.recordset;
      const invoiceIds = orphanedInvoices.map((inv: any) => inv.AutoIndex);

      if (invoiceIds.length === 0) {
        return {
          deleted: false,
          count: 0,
          message: "No orphaned invoices found",
          invoiceIds: [],
        };
      }

      console.log(`🗑️  Deleting ${invoiceIds.length} orphaned invoice(s)...`);

      // Delete the orphaned invoices (no need to delete lines as they don't exist)
      // IDs are already validated from database, safe to use directly
      const idsString = invoiceIds.join(", ");
      await this.pool.request().query(`
        DELETE FROM dbo.InvNumX
        WHERE AutoIndex IN (${idsString})
      `);

      console.log(`✅ Deleted ${invoiceIds.length} orphaned invoice(s)`);

      return {
        deleted: true,
        count: invoiceIds.length,
        message: `Successfully deleted ${invoiceIds.length} orphaned invoice(s)`,
        invoiceIds,
      };
    } catch (error: any) {
      console.error("❌ Error deleting orphaned invoices:", error.message);
      throw new Error(`Failed to delete orphaned invoices: ${error.message}`);
    }
  }

  /**
   * Delete all invoices with iLines > 0 and their corresponding line items
   * Returns count of deleted invoices and lines
   */
  async deleteAllInvoicesWithLines(): Promise<{
    deleted: boolean;
    invoiceCount: number;
    lineCount: number;
    message: string;
    invoiceIds: number[];
  }> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      console.log("🔍 Finding all invoices with iLines > 0...");

      // Find all invoices with iLines > 0
      const invoicesQuery = await this.pool.request().query(`
        SELECT AutoIndex, OrderNum, iLines
        FROM dbo.InvNumX
        WHERE iLines IS NOT NULL AND iLines > 0
      `);

      const invoices = invoicesQuery.recordset;
      const invoiceIds = invoices.map((inv: any) => inv.AutoIndex);

      if (invoiceIds.length === 0) {
        return {
          deleted: false,
          invoiceCount: 0,
          lineCount: 0,
          message: "No invoices with iLines > 0 found",
          invoiceIds: [],
        };
      }

      console.log(
        `🗑️  Deleting ${invoiceIds.length} invoice(s) and their line items...`
      );

      // Count line items before deletion
      // IDs are already validated from database (they're integers from AutoIndex)
      // Validate all IDs are numbers for safety
      const validIds = invoiceIds.filter(
        (id) => Number.isInteger(id) && id > 0
      );
      if (validIds.length === 0) {
        return {
          deleted: false,
          invoiceCount: 0,
          lineCount: 0,
          message: "No valid invoice IDs found",
          invoiceIds: [],
        };
      }

      // IDs are safe - they come directly from database AutoIndex (integers)
      // Join with commas for IN clause
      const idsString = validIds.join(", ");

      // Count line items before deletion
      const lineCountResult = await this.pool.request().query(`
        SELECT COUNT(*) AS Count
        FROM dbo._btblInvoiceLinesX
        WHERE iInvoiceID IN (${idsString})
      `);
      const lineCount = lineCountResult.recordset[0].Count;

      // Delete line items first (due to foreign key constraints)
      await this.pool.request().query(`
        DELETE FROM dbo._btblInvoiceLinesX
        WHERE iInvoiceID IN (${idsString})
      `);

      // Delete invoice headers
      await this.pool.request().query(`
        DELETE FROM dbo.InvNumX
        WHERE AutoIndex IN (${idsString})
      `);

      console.log(
        `✅ Deleted ${validIds.length} invoice(s) and ${lineCount} line item(s)`
      );

      return {
        deleted: true,
        invoiceCount: validIds.length,
        lineCount,
        message: `Successfully deleted ${validIds.length} invoice(s) and ${lineCount} line item(s)`,
        invoiceIds: validIds,
      };
    } catch (error: any) {
      console.error("❌ Error deleting invoices:", error.message);
      throw new Error(`Failed to delete invoices: ${error.message}`);
    }
  }

  /**
   * Get invoice line items for database viewer (X-suffixed tables)
   * Only shows line items for the latest 50 invoices with iLines > 0 (orders from OdaFlow)
   */
  async getInvoiceLines(): Promise<any[]> {
    try {
      if (!this.pool) {
        throw new Error("Database not connected");
      }

      // Check if X-suffixed table exists
      const tableCheck = await this.pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '_btblInvoiceLinesX'
      `);

      if (tableCheck.recordset.length === 0) {
        console.log("ℹ️ _btblInvoiceLinesX table doesn't exist");
        return [];
      }

      // Get line items only for the latest 50 OdaFlow invoices
      const result = await this.pool.request().query(`
          SELECT 
            l.idInvoiceLines, l.iInvoiceID, l.cDescription, l.fQuantity, 
            l.fUnitPriceIncl, l.fQuantityLineTotIncl, 
            l.iStockCodeID, l.fTaxRate, l.iTaxTypeID, l.iLineID
          FROM dbo._btblInvoiceLinesX l
          WHERE l.iInvoiceID IN (
            SELECT TOP 50 AutoIndex 
            FROM dbo.InvNumX 
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
