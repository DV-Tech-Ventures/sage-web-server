import express from "express";
import fs from "fs";
import path from "path";
import https from "https";
import { SageDatabaseService } from "./services/sageDatabase.service";
import { WebhookService } from "./services/webhook.service";
import { WebhookController } from "./controllers/webhook.controller";
import {
  loggingMiddleware,
  errorHandlingMiddleware,
  notFoundMiddleware,
} from "./middleware/logging.middleware";
import {
  DatabaseConfig,
  validateDatabaseConfig,
} from "./config/database.config";

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0"; // Listen on all interfaces for public access

// Middleware
app.use(express.json({ limit: "10mb" }));

// Serve static files (for setup UI) - handle both dev and pkg bundled paths
// When compiled, __dirname is the dist folder, so we need to go up to find src
const baseDir = process.cwd(); // This is the extracted ZIP directory
const setupPath = path.join(baseDir, "src", "setup");
const viewsPath = path.join(baseDir, "src", "views");

console.log(`📁 Base directory: ${baseDir}`);
console.log(`📁 __dirname: ${__dirname}`);
console.log(`📁 Setup path: ${setupPath}`);
console.log(`📁 Views path: ${viewsPath}`);

console.log(`📁 Setup path: ${setupPath}`);
console.log(`📁 Views path: ${viewsPath}`);
console.log(`📁 Setup exists: ${fs.existsSync(setupPath)}`);
console.log(`📁 Views exists: ${fs.existsSync(viewsPath)}`);

app.use("/setup", express.static(setupPath));

// Global services
let sageDbService: SageDatabaseService | null = null;
let webhookService: WebhookService | null = null;
let webhookController: WebhookController | null = null;
let isConfigured = false;

/**
 * Check if server is configured
 */
function checkConfiguration(): {
  configured: boolean;
  config?: any;
  error?: string;
} {
  try {
    const configPath = path.join(__dirname, "../config.json");

    if (!fs.existsSync(configPath)) {
      return { configured: false, error: "No configuration file found" };
    }

    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);

    if (!config.database) {
      return { configured: false, error: "Database configuration missing" };
    }

    const validation = validateDatabaseConfig(config.database);
    if (!validation.valid) {
      return {
        configured: false,
        error: `Invalid configuration: ${validation.errors.join(", ")}`,
      };
    }

    return { configured: true, config };
  } catch (error: any) {
    return { configured: false, error: error.message };
  }
}

/**
 * Initialize webhook services (never throws errors)
 */
async function initializeWebhookServices(
  dbConfig: DatabaseConfig
): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    console.log("🔧 Initializing webhook services...");

    // Initialize database service
    sageDbService = new SageDatabaseService(dbConfig);

    // Test connection (don't let this fail the server startup)
    console.log("🔌 Testing Sage database connection...");
    const connected = await sageDbService.testConnection();

    if (connected) {
      console.log("   ✅ Sage database connection successful");

      // Show database stats
      const stats = await sageDbService.getStats();
      console.log(`   📊 Database has ${stats.totalInvoices} invoices`);

      // Initialize services
      webhookService = new WebhookService(sageDbService);
      webhookController = new WebhookController(webhookService);

      isConfigured = true;
      console.log("   ✅ Webhook services ready");
      return { success: true, stats };
    } else {
      console.log("   ⚠️ Database connection failed - UI will show error");
      return { success: false, error: "Database connection failed" };
    }
  } catch (error: any) {
    console.log(`   ⚠️ Service initialization failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Global state for UI
let dbConnectionStatus: {
  connected: boolean;
  error: string;
  stats: any;
} = { connected: false, error: "", stats: null };

/**
 * Main page - always shows UI (never fails)
 */
app.get("/", async (req, res) => {
  const configCheck = checkConfiguration();

  // Always try to get current connection status
  if (configCheck.configured && sageDbService) {
    try {
      const connected = await sageDbService.testConnection();
      if (connected) {
        const stats = await sageDbService.getStats();
        dbConnectionStatus = { connected: true, error: "", stats };
      } else {
        dbConnectionStatus = {
          connected: false,
          error: "Connection test failed",
          stats: null,
        };
      }
    } catch (error: any) {
      dbConnectionStatus = {
        connected: false,
        error: error.message,
        stats: null,
      };
    }
  }

  if (configCheck.configured) {
    // Show webhook status page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sage ERP Webhook Server</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .status { padding: 15px; border-radius: 8px; margin: 15px 0; }
          .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
          .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
          .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; border: none; cursor: pointer; font-size: 14px; }
          .button:hover { background: #0056b3; }
          .button.secondary { background: #6c757d; }
          .button.success { background: #28a745; }
          .button.warning { background: #ffc107; color: #212529; }
          .code { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
          .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔗 Sage ERP Webhook Server</h1>
            <p>Integration Status & Configuration</p>
          </div>
          
          <div class="status ${
            dbConnectionStatus.connected ? "success" : "error"
          }">
            <strong>${
              dbConnectionStatus.connected
                ? "✅ Database Connected"
                : "❌ Database Connection Failed"
            }</strong><br>
            Database: ${configCheck.config?.database?.database || "Unknown"}<br>
            Server: ${configCheck.config?.database?.server || "Unknown"}:${
      configCheck.config?.database?.port || 1433
    }<br>
            ${
              dbConnectionStatus.error
                ? `Error: ${dbConnectionStatus.error}`
                : ""
            }
          </div>

          ${
            dbConnectionStatus.connected && dbConnectionStatus.stats
              ? `
          <div class="stats">
            <div class="stat-box">
              <strong>${
                (dbConnectionStatus.stats as any)?.totalInvoices || 0
              }</strong><br>
              Total Invoices
            </div>
            <div class="stat-box">
              <strong>${
                (dbConnectionStatus.stats as any)?.totalLineItems || 0
              }</strong><br>
              Line Items
            </div>
            <div class="stat-box">
              <strong>${
                (dbConnectionStatus.stats as any)?.lastInvoiceDate
                  ? new Date(
                      (dbConnectionStatus.stats as any).lastInvoiceDate
                    ).toLocaleDateString()
                  : "None"
              }</strong><br>
              Last Invoice
            </div>
          </div>
          `
              : ""
          }

          <div class="status info">
            <strong>📡 Webhook Endpoint</strong><br>
            <code>POST http://localhost:${port}/receive-order</code><br>
            <em>Use ngrok to expose this endpoint publicly</em>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            ${
              dbConnectionStatus.connected
                ? '<button onclick="testWebhook()" class="button success">🧪 Test Webhook</button>'
                : '<button onclick="fixConnection()" class="button warning">🔧 Fix Connection</button>'
            }
            <a href="/setup" class="button secondary">⚙️ Reconfigure Database</a>
            <button onclick="refreshStatus()" class="button">🔄 Refresh Status</button>
            <a href="/health" class="button">📊 Health Check</a>
          </div>

          ${
            !dbConnectionStatus.connected
              ? `
          <div class="status warning">
            <strong>⚠️ Database Connection Issues</strong><br>
            The webhook server is running but cannot connect to your Sage database.<br>
            Click "Fix Connection" to update your database settings.
          </div>
          `
              : `
          <div class="code">
            <strong>💡 Next Steps:</strong><br>
            1. Run: <code>ngrok http ${port}</code> in another terminal<br>
            2. Copy the HTTPS URL from ngrok<br>
            3. Configure it in OdaFlow webhook settings<br>
            4. Approve orders to test integration!
          </div>
          `
          }

          <div id="testResult" style="display: none;"></div>
        </div>

        <script>
          async function testWebhook() {
            const resultDiv = document.getElementById('testResult');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="status info">🧪 Testing webhook endpoint...</div>';

            try {
              const response = await fetch('/test-webhook', { method: 'POST' });
              const result = await response.json();
              
              if (result.success) {
                resultDiv.innerHTML = '<div class="status success"><strong>✅ Webhook Test Successful!</strong><br>Response time: ' + result.responseTime + 'ms<br>Ready to receive orders from OdaFlow</div>';
              } else {
                resultDiv.innerHTML = '<div class="status error"><strong>❌ Webhook Test Failed</strong><br>' + result.error + '</div>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<div class="status error"><strong>❌ Test Error</strong><br>' + error.message + '</div>';
            }
          }

          function fixConnection() {
            window.location.href = '/setup';
          }

          function refreshStatus() {
            window.location.reload();
          }

          // Auto-refresh status every 30 seconds
          setInterval(() => {
            location.reload();
          }, 30000);
        </script>
      </body>
      </html>
    `);
  } else {
    // Show setup page
    res.redirect("/setup");
  }
});

/**
 * Setup page
 */
app.get("/setup", (req, res) => {
  const setupFile = path.join(setupPath, "setup.html");
  if (fs.existsSync(setupFile)) {
    res.sendFile(setupFile);
  } else {
    res.status(404).send(`
      <h1>Setup page not found</h1>
      <p>Setup file not found at: ${setupFile}</p>
      <p>Current working directory: ${process.cwd()}</p>
      <p>__dirname: ${__dirname}</p>
    `);
  }
});

/**
 * Database viewer page
 */
app.get("/database", (req, res) => {
  const databaseFile = path.join(viewsPath, "database.html");
  if (fs.existsSync(databaseFile)) {
    res.sendFile(databaseFile);
  } else {
    res.status(404).send(`
      <h1>Database viewer not found</h1>
      <p>Database file not found at: ${databaseFile}</p>
      <p>Available files: ${
        fs.existsSync(viewsPath)
          ? fs.readdirSync(viewsPath).join(", ")
          : "Views directory not found"
      }</p>
    `);
  }
});

/**
 * Professional health page
 */
app.get("/health", (req, res) => {
  // Check if request wants JSON (API call) or HTML (browser)
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    // Return JSON for API calls
    return res.redirect("/api/health-data");
  }

  // Return HTML for browser
  const healthFile = path.join(viewsPath, "health.html");
  if (fs.existsSync(healthFile)) {
    res.sendFile(healthFile);
  } else {
    res.status(404).send(`
      <h1>Health page not found</h1>
      <p>Health file not found at: ${healthFile}</p>
      <p>Available files: ${
        fs.existsSync(viewsPath)
          ? fs.readdirSync(viewsPath).join(", ")
          : "Views directory not found"
      }</p>
    `);
  }
});

/**
 * API endpoint for health data (JSON)
 */
app.get("/api/health-data", async (req, res) => {
  try {
    if (!sageDbService) {
      return res.json({
        status: "not_configured",
        message: "Database not configured",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    }

    const isConnected = sageDbService.isConnected();
    let stats = null;

    if (isConnected) {
      try {
        stats = await sageDbService.getStats();
      } catch (error) {
        // Stats failed but connection might still work
      }
    }

    res.json({
      status: "running",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: "Sage ERP Webhook Server is running",
      database: stats,
      connection: {
        isConnected,
        server: "localhost", // or actual server from config
        database: "SageTest", // or actual database from config
      },
      webhook: {
        status: "running",
        uptime: process.uptime(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

/**
 * API endpoint for database data
 */
app.get("/api/database-data", async (req, res) => {
  try {
    if (!sageDbService || !sageDbService.isConnected()) {
      return res.json({
        success: false,
        error: "Database not connected",
      });
    }

    // Get invoice headers
    const invoices = await sageDbService.getInvoices();

    // Get invoice lines
    const lines = await sageDbService.getInvoiceLines();

    res.json({
      success: true,
      invoices,
      lines,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Setup API endpoints
 */

// Get existing configuration
app.get("/api/get-config", (req, res) => {
  const configCheck = checkConfiguration();

  if (configCheck.configured) {
    // Don't send password for security
    const safeConfig = { ...configCheck.config };
    if (safeConfig.database && safeConfig.database.password) {
      safeConfig.database.password = "";
    }

    res.json({
      success: true,
      config: safeConfig,
      hasExistingConfig: true,
    });
  } else {
    res.json({
      success: false,
      message: configCheck.error,
      hasExistingConfig: false,
    });
  }
});

// Test database connection
app.post("/api/test-connection", async (req, res) => {
  try {
    const { database: dbConfig } = req.body;

    const validation = validateDatabaseConfig(dbConfig);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: `Configuration invalid: ${validation.errors.join(", ")}`,
      });
    }

    const sageDb = new SageDatabaseService(dbConfig);
    const connected = await sageDb.testConnection();

    if (connected) {
      const stats = await sageDb.getStats();
      await sageDb.disconnect();

      res.json({
        success: true,
        message: "Connection successful",
        database: dbConfig.database,
        stats,
      });
    } else {
      await sageDb.disconnect();
      res.json({
        success: false,
        error: "Could not connect to database. Check your settings.",
      });
    }
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
    });
  }
});

// Save configuration
app.post("/api/save-config", async (req, res) => {
  try {
    const newConfig = req.body;

    const validation = validateDatabaseConfig(newConfig.database);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: `Configuration invalid: ${validation.errors.join(", ")}`,
      });
    }

    const configPath = path.join(__dirname, "../config.json");

    // Merge with existing config if it exists
    let finalConfig = newConfig;
    if (fs.existsSync(configPath)) {
      try {
        const existingContent = fs.readFileSync(configPath, "utf8");
        const existingConfig = JSON.parse(existingContent);
        finalConfig = {
          ...existingConfig,
          database: newConfig.database,
        };
      } catch (error) {
        // Use new config if existing is invalid
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));

    console.log("💾 Configuration saved");
    console.log(`   Database: ${finalConfig.database.database}`);
    console.log(
      `   Server: ${finalConfig.database.server}:${finalConfig.database.port}`
    );

    // Try to initialize webhook services with new config
    const initialized = await initializeWebhookServices(newConfig.database);

    res.json({
      success: true,
      message: "Configuration saved successfully",
      configPath: configPath,
      webhookReady: initialized,
      database: finalConfig.database.database,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Webhook endpoints (only work if configured)
 */

// Main webhook endpoint
app.post("/receive-order", (req, res) => {
  if (!isConfigured || !webhookController) {
    return res.status(503).json({
      success: false,
      error: "Webhook server not configured. Please configure database first.",
      setupUrl: "/setup",
    });
  }

  webhookController.receiveOrder(req, res);
});

// Health check
app.get("/health", async (req, res) => {
  if (!isConfigured || !webhookController) {
    return res.json({
      status: "not_configured",
      message: "Database not configured",
      setupUrl: "/setup",
    });
  }

  webhookController.healthCheck(req, res);
});

// Statistics
app.get("/stats", async (req, res) => {
  if (!isConfigured || !webhookController) {
    return res.json({
      error: "Database not configured",
      setupUrl: "/setup",
    });
  }

  webhookController.getStats(req, res);
});

// Start webhook server endpoint
app.post("/api/start-webhook", (req, res) => {
  try {
    const configCheck = checkConfiguration();

    if (!configCheck.configured) {
      return res.json({
        success: false,
        error: "No configuration found. Please save configuration first.",
      });
    }

    res.json({
      success: true,
      message: "Webhook server is already running! You can test it now.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete ALL BETA data (PRODUCTION CLEANUP)
app.post("/api/delete-all-beta-data", async (req, res) => {
  try {
    if (!sageDbService) {
      return res.json({
        success: false,
        error: "Database not configured",
      });
    }

    if (!sageDbService.isConnected()) {
      return res.json({
        success: false,
        error: "Database not connected",
      });
    }

    console.log("🚨 Deleting ALL BETA test data...");
    const result = await sageDbService.deleteAllBetaData();

    res.json({
      success: result.deleted,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    console.error("❌ Error deleting BETA data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete BETA tables endpoint
app.post("/api/delete-beta-tables", async (req, res) => {
  try {
    if (!sageDbService) {
      return res.json({
        success: false,
        error: "Database not configured. Please configure database first.",
      });
    }

    if (!sageDbService.isConnected()) {
      return res.json({
        success: false,
        error: "Database not connected. Please test connection first.",
      });
    }

    console.log("🗑️ Deleting BETA tables via API request...");
    const result = await sageDbService.deleteAllBetaData();

    res.json({
      success: result.deleted,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    console.error("❌ API error deleting BETA tables:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test webhook endpoint (inserts and immediately deletes for clean testing)
app.post("/test-webhook", async (req, res) => {
  if (!isConfigured || !webhookService) {
    return res.json({
      success: false,
      error: "Webhook server not configured",
    });
  }

  try {
    console.log(
      "🧪 Running webhook test (insert + delete for clean testing)..."
    );

    // Test payload matching WEBHOOK_SYSTEM_IMPLEMENTATION.md format exactly
    const testOrderNum = "TEST-DELETE-" + Date.now();
    const testPayload = {
      deliveryId: "ui-test-" + Date.now(),
      timestamp: new Date(),
      invoiceHeader: {
        DocType: 4,
        DocState: 1,
        AccountID: 5255, // From SageBranchMapping example
        OrderNum: testOrderNum,
        InvDate: new Date().toISOString().split("T")[0], // "2025-11-27" format
        TaxInclusive: false, // MUST BE false
        InvTotExcl: 5000,
        InvTotTax: 0, // MUST BE 0
        InvTotIncl: 5000,
        OrdTotExcl: 5000,
        OrdTotTax: 0,
        OrdTotIncl: 5000,
        Description: "Sales Order - Test",
        iLines: 1, // Number of line items - custom field we added
      },
      invoiceLines: [
        {
          iLineID: 1,
          cDescription: "REGINA PASTA PENNE 400GM - TEST",
          fQuantity: 10,
          iStockCodeID: 2299, // From ERPProductMapping example
          fUnitPriceExcl: 500,
          fUnitPriceIncl: 500,
          fTaxRate: 0, // MUST BE 0
          iTaxTypeID: 12, // MUST BE 12
          iWarehouseID: 1,

          fQuantityLineTotExcl: 5000,
          fQuantityLineTotIncl: 5000,
        },
      ],
      metadata: {
        orderId: "ui-test-order",
        orderNumber: testOrderNum,
        erpSystem: "sage",
        currency: "KES",
        taxRate: 0,
      },
    };

    const startTime = Date.now();

    // Process the order (insert to database)
    const result = await webhookService.processOrder(testPayload as any);
    const responseTime = Date.now() - startTime;

    // If successful, immediately delete the test data to keep database clean
    if (result.success && result.sageInvoiceId && sageDbService) {
      try {
        console.log(
          `🧹 Cleaning up test data (Invoice ID: ${result.sageInvoiceId})...`
        );

        // Delete test line items first (due to foreign key)
        await sageDbService.executeQuery(`
          DELETE FROM dbo._btblInvoiceLines WHERE iInvoiceID = ${result.sageInvoiceId}
        `);

        // Delete test header
        await sageDbService.executeQuery(`
          DELETE FROM dbo.InvNum WHERE AutoIndex = ${result.sageInvoiceId}
        `);

        console.log("✅ Test data cleaned up - database remains clean");

        res.json({
          success: true,
          responseTime,
          message: "✅ Webhook test successful! Data inserted and cleaned up.",
          sageInvoiceId: result.sageInvoiceId,
          note: "Test data was automatically deleted to keep database clean",
        });
      } catch (cleanupError: any) {
        console.log(
          `⚠️ Test successful but cleanup failed: ${cleanupError.message}`
        );
        res.json({
          success: true,
          responseTime,
          message:
            "✅ Webhook test successful! (Note: Test data remains in database)",
          sageInvoiceId: result.sageInvoiceId,
          warning: "Test data cleanup failed - you may need to delete manually",
        });
      }
    } else {
      // Test failed, return error
      res.json({
        success: result.success,
        responseTime,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      responseTime: 0,
    });
  }
});

// Error handling
app.use(errorHandlingMiddleware);
app.use("*", notFoundMiddleware);

/**
 * Start unified server (never fails)
 */
async function startServer() {
  console.log("\n" + "🚀".repeat(20));
  console.log("🔗 Sage ERP Webhook Server");
  console.log("🚀".repeat(20));

  // Start HTTP server (simple and direct)
  app.listen(Number(port), host, () => {
    console.log(`📡 Server running on: http://localhost:${port}`);
    console.log(`🌐 Public access: http://41.90.121.217:${port}`);
    console.log(`🔧 Setup interface: http://localhost:${port}/setup`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📥 Webhook endpoint: http://localhost:${port}/receive-order`);

    console.log("\n✅ Web interface is ready!");
    console.log("💡 Open http://localhost:3000 in your browser");
    console.log("\n🎯 For OdaFlow webhook configuration:");
    console.log(`   Webhook URL: http://41.90.121.217:${port}/receive-order`);
    console.log("\n⏰ Server ready for webhook calls...\n");
  });

  // Try to initialize services in background (don't block server startup)
  setTimeout(async () => {
    try {
      const configCheck = checkConfiguration();

      if (configCheck.configured) {
        console.log("📋 Found existing configuration - testing connection...");

        const result = await initializeWebhookServices(
          configCheck.config.database
        );

        if (result.success) {
          console.log("✅ Webhook services initialized successfully");
        } else {
          console.log(`⚠️  Database connection issue: ${result.error}`);
          console.log("💡 Use the web interface to fix the connection");
        }
      } else {
        console.log("⚙️  No configuration found");
        console.log("💡 Open http://localhost:3000 to configure database");
      }
    } catch (error: any) {
      console.log(`⚠️  Background initialization failed: ${error.message}`);
      console.log(
        "💡 Server is still running - use web interface to configure"
      );
    }
  }, 1000); // Initialize after server starts
}

// Graceful shutdown
async function shutdown() {
  console.log("\n📴 Shutting down server...");
  if (sageDbService) {
    await sageDbService.disconnect();
  }
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});
