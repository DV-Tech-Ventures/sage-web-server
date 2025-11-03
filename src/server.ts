import express from "express";
import fs from "fs";
import path from "path";
import { SageDatabaseService } from "./services/sageDatabase.service";
import { WebhookService } from "./services/webhook.service";
import { WebhookController } from "./controllers/webhook.controller";
import {
  loggingMiddleware,
  errorHandlingMiddleware,
  notFoundMiddleware,
} from "./middleware/logging.middleware";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(loggingMiddleware);

/**
 * Load database configuration from config.json
 */
function loadConfigFromFile() {
  try {
    const configPath = path.join(__dirname, "../config.json");

    if (!fs.existsSync(configPath)) {
      throw new Error(
        "Configuration file not found. Please run 'npm run setup' first."
      );
    }

    const configContent = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent);

    if (!config.database) {
      throw new Error("Database configuration not found in config.json");
    }

    return config.database;
  } catch (error: any) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

// Initialize services
let sageDbService: SageDatabaseService;
let webhookService: WebhookService;
let webhookController: WebhookController;

async function initializeServices() {
  try {
    console.log("🔧 Initializing services...");

    // Load database configuration from config.json
    const dbConfig = loadConfigFromFile();
    console.log("   ✅ Database configuration loaded from config.json");

    // Initialize database service
    sageDbService = new SageDatabaseService(dbConfig);

    // Test connection on startup
    console.log("🔌 Testing Sage database connection...");
    const connected = await sageDbService.testConnection();

    if (connected) {
      console.log("   ✅ Sage database connection successful");
    } else {
      console.log(
        "   ⚠️  Sage database connection failed - will retry on first request"
      );
    }

    // Initialize services
    webhookService = new WebhookService(sageDbService);
    webhookController = new WebhookController(webhookService);

    console.log("   ✅ All services initialized");
  } catch (error: any) {
    console.error("❌ Service initialization failed:", error.message);
    console.error("\n📋 Please check your configuration:");
    console.error("   1. Copy config.example.json to config.json");
    console.error("   2. Or copy env.example to .env");
    console.error("   3. Update with your Sage database details");
    console.error(
      "\nServer will continue in test mode without database connection."
    );

    // Initialize with mock service for testing
    const mockDbService = new SageDatabaseService({
      server: "localhost",
      database: "test",
      username: "test",
      password: "test",
    });
    webhookService = new WebhookService(mockDbService);
    webhookController = new WebhookController(webhookService);
  }
}

// Routes
app.post("/receive-order", (req, res) =>
  webhookController.receiveOrder(req, res)
);

app.get("/health", (req, res) => webhookController.healthCheck(req, res));
app.get("/stats", (req, res) => webhookController.getStats(req, res));
app.get("/", (req, res) => webhookController.info(req, res));

// Error handling
app.use(errorHandlingMiddleware);
app.use("*", notFoundMiddleware);

// Initialize and start server
async function startServer() {
  await initializeServices();

  app.listen(port, () => {
    console.log("\n" + "🚀".repeat(20));
    console.log("🔗 Sage ERP Webhook Server Started");
    console.log("🚀".repeat(20));
    console.log(`📡 Server running on: http://localhost:${port}`);
    console.log(`🔍 Health check: http://localhost:${port}/health`);
    console.log(`📊 Statistics: http://localhost:${port}/stats`);
    console.log(`📋 Info page: http://localhost:${port}/`);
    console.log(`📥 Webhook endpoint: http://localhost:${port}/receive-order`);
    console.log("\n💡 Usage:");
    console.log(
      "1. Configure Sage database connection (see config.example.json)"
    );
    console.log("2. Run 'ngrok http 3000' to expose server");
    console.log("3. Use ngrok HTTPS URL in OdaFlow webhook config");
    console.log("4. Approve orders in OdaFlow to test integration");
    console.log("\n🧪 Test scenarios (order number patterns):");
    console.log("   - Normal: PO-2024-001 → 200 Success");
    console.log("   - Duplicate: PO-2024-DUPLICATE-001 → 409 Conflict");
    console.log("   - Bad Request: PO-2024-BADREQ-001 → 400 Bad Request");
    console.log("   - Not Found: PO-2024-NOTFOUND-001 → 404 Not Found");
    console.log("\n⏰ Waiting for webhook calls...\n");
  });
}

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 Shutting down webhook test server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📴 Shutting down webhook test server...");
  process.exit(0);
});
