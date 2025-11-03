import { WebhookPayload, WebhookResponse } from "../types";
import { SageDatabaseService } from "./sageDatabase.service";
import { DatabaseConfig } from "../config/database.config";

/**
 * Webhook Processing Service
 * Handles incoming webhook data and processes it to Sage
 */
export class WebhookService {
  private sageDb: SageDatabaseService;

  constructor(sageDb: SageDatabaseService) {
    this.sageDb = sageDb;
  }

  /**
   * Process incoming webhook order data
   */
  async processOrder(payload: WebhookPayload): Promise<WebhookResponse> {
    try {
      console.log("\n" + "=".repeat(60));
      console.log("📥 WEBHOOK RECEIVED - ORDER DATA");
      console.log("=".repeat(60));

      // Validate payload
      const validation = this.validatePayload(payload);
      if (!validation.valid) {
        console.error("❌ Validation Error:", validation.error);
        return {
          success: false,
          error: validation.error!,
        };
      }

      // Log delivery details
      this.logOrderDetails(payload);

      // Check for duplicate order
      const orderExists = await this.sageDb.orderExists(payload.metadata.orderNumber);
      if (orderExists) {
        console.log("⚠️  Order already exists in Sage (409 Conflict)");
        return {
          success: false,
          error: `Order ${payload.metadata.orderNumber} already exists in Sage`,
          httpStatus: 409, // This will stop retries
        };
      }

      // Test scenarios based on order number (for testing)
      const testResponse = this.handleTestScenarios(payload.metadata.orderNumber);
      if (testResponse) {
        return testResponse;
      }

      // Process to Sage database
      let sageInvoiceId: number;

      if (this.sageDb.isConnected()) {
        // Real database mode
        console.log("💾 Saving to real Sage database...");
        sageInvoiceId = await this.sageDb.insertInvoiceHeader(payload.invoiceHeader);
        await this.sageDb.insertInvoiceLines(payload.invoiceLines, sageInvoiceId);
      } else {
        // Mock mode for testing
        console.log("🎭 Mock mode - simulating database save...");
        sageInvoiceId = Math.floor(Math.random() * 10000) + 1000;
        
        console.log("   📄 Would insert invoice header:");
        console.log("      Table: dbo.InvNum");
        console.log(`      OrderNum: ${payload.invoiceHeader.OrderNum}`);
        console.log(`      Total: ${payload.invoiceHeader.InvTotIncl}`);
        
        console.log("   📦 Would insert invoice lines:");
        payload.invoiceLines.forEach((line, index) => {
          console.log(`      Line ${index + 1}: ${line.cDescription} (Qty: ${line.fQuantity})`);
        });
      }

      console.log("✅ Order processed successfully!");
      console.log(`   Sage Invoice ID: ${sageInvoiceId}`);
      console.log("=".repeat(60) + "\n");

      return {
        success: true,
        message: "Order saved successfully to Sage ERP",
        sageInvoiceId,
      };

    } catch (error: any) {
      console.error("❌ Order processing error:", error.message);
      
      return {
        success: false,
        error: error.message || "Unknown error",
        httpStatus: 500,
      };
    }
  }

  /**
   * Validate webhook payload
   */
  private validatePayload(payload: WebhookPayload): { valid: boolean; error?: string } {
    if (!payload.deliveryId) {
      return { valid: false, error: "Missing deliveryId" };
    }

    if (!payload.invoiceHeader || !payload.invoiceLines) {
      return { valid: false, error: "Missing invoiceHeader or invoiceLines" };
    }

    if (!payload.metadata?.orderNumber) {
      return { valid: false, error: "Missing metadata.orderNumber" };
    }

    // Validate required header fields
    const requiredHeaderFields = ["DocType", "DocState", "AccountID", "OrderNum"];
    for (const field of requiredHeaderFields) {
      const headerValue = (payload.invoiceHeader as any)[field];
      if (headerValue === undefined || headerValue === null) {
        return { valid: false, error: `Missing required header field: ${field}` };
      }
    }

    // Validate invoice lines
    if (!Array.isArray(payload.invoiceLines) || payload.invoiceLines.length === 0) {
      return { valid: false, error: "Invoice lines must be a non-empty array" };
    }

    return { valid: true };
  }

  /**
   * Log order details for monitoring
   */
  private logOrderDetails(payload: WebhookPayload): void {
    console.log("📋 Delivery Details:");
    console.log(`   Delivery ID: ${payload.deliveryId}`);
    console.log(`   Timestamp: ${payload.timestamp}`);
    console.log(`   Order Number: ${payload.metadata.orderNumber}`);
    console.log(`   Manufacturer ID: ${payload.metadata.manufacturerId}`);
    console.log(`   ERP System: ${payload.metadata.erpSystem}`);
    console.log(`   Currency: ${payload.metadata.currency}`);
    console.log(`   Tax Rate: ${payload.metadata.taxRate}%`);

    // Log invoice header
    console.log("\n📄 Invoice Header:");
    const header = payload.invoiceHeader;
    console.log(`   DocType: ${header.DocType} (${header.DocType === 4 ? 'Sales Order ✅' : 'Unknown'})`);
    console.log(`   DocState: ${header.DocState} (${header.DocState === 1 ? 'Active ✅' : 'Unknown'})`);
    console.log(`   AccountID: ${header.AccountID}`);
    console.log(`   Order Number: ${header.OrderNum}`);
    console.log(`   Invoice Date: ${header.InvDate}`);
    console.log(`   Tax Inclusive: ${header.TaxInclusive ? 'Yes' : 'No'}`);
    console.log(`   Total (Excl): ${header.InvTotExcl} ${payload.metadata.currency}`);
    console.log(`   Tax Amount: ${header.InvTotTax} ${payload.metadata.currency}`);
    console.log(`   Total (Incl): ${header.InvTotIncl} ${payload.metadata.currency}`);
    
    if (header.Address1) {
      console.log(`   Address: ${header.Address1}, ${header.Address2 || ''}, ${header.Address3 || ''}`);
    }

    // Log invoice lines
    console.log(`\n📦 Invoice Lines (${payload.invoiceLines.length} items):`);
    payload.invoiceLines.forEach((line: any, index: number) => {
      console.log(`   ${index + 1}. ${line.cDescription}`);
      console.log(`      Quantity: ${line.fQuantity}`);
      console.log(`      Unit Price: ${line.fUnitPriceIncl} ${payload.metadata.currency} (incl tax)`);
      console.log(`      Stock Code ID: ${line.iStockCodeID}`);
      console.log(`      Line Total: ${line.fQuantityLineTotIncl} ${payload.metadata.currency}`);
      console.log(`      Tax Rate: ${line.fTaxRate}%`);
    });
  }

  /**
   * Handle test scenarios for development/testing
   */
  private handleTestScenarios(orderNumber: string): WebhookResponse | null {
    if (orderNumber.includes("DUPLICATE")) {
      console.log("⚠️  Simulating duplicate order (409 Conflict)");
      return {
        success: false,
        error: `Order ${orderNumber} already exists in Sage`,
        httpStatus: 409,
      };
    }
    
    if (orderNumber.includes("BADREQ")) {
      console.log("⚠️  Simulating bad request (400) - will retry");
      return {
        success: false,
        error: "Invalid data format",
        httpStatus: 400,
      };
    }
    
    if (orderNumber.includes("NOTFOUND")) {
      console.log("⚠️  Simulating not found (404) - will retry");
      return {
        success: false,
        error: "Endpoint not found",
        httpStatus: 404,
      };
    }

    return null; // No test scenario, process normally
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<any> {
    try {
      const dbStats = await this.sageDb.getStats();
      return {
        database: dbStats,
        connection: {
          isConnected: this.sageDb.isConnected(),
          server: this.config.server,
          database: this.config.database,
        },
        webhook: {
          status: "running",
          uptime: process.uptime(),
        },
      };
    } catch (error: any) {
      return {
        error: error.message,
        connection: {
          isConnected: false,
        },
      };
    }
  }

  /**
   * Close connections
   */
  async cleanup(): Promise<void> {
    await this.sageDb.disconnect();
  }

  private get config(): any {
    return (this.sageDb as any).config;
  }
}
