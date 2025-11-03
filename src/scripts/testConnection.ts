import fs from "fs";
import path from "path";
import { SageDatabaseService } from "../services/sageDatabase.service";

/**
 * Load database configuration from config.json
 */
function loadConfigFromFile() {
  try {
    const configPath = path.join(__dirname, "../../config.json");

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

/**
 * Test Sage database connection
 */
async function testConnection() {
  try {
    console.log("🧪 Testing Sage Database Connection\n");

    // Load configuration from config.json
    const dbConfig = loadConfigFromFile();
    console.log("📋 Database Configuration:");
    console.log(`   Server: ${dbConfig.server}:${dbConfig.port || 1433}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   Username: ${dbConfig.username}`);
    console.log(`   Encrypt: ${dbConfig.encrypt || false}`);

    // Initialize database service
    const sageDb = new SageDatabaseService(dbConfig);

    // Test connection
    console.log("\n🔌 Testing connection...");
    const connected = await sageDb.testConnection();

    if (connected) {
      console.log("✅ Connection successful!");

      // Get database statistics
      console.log("\n📊 Database Statistics:");
      const stats = await sageDb.getStats();
      console.log(`   Total Invoices: ${stats.totalInvoices}`);
      console.log(`   Total Line Items: ${stats.totalLineItems}`);
      if (stats.lastInvoiceDate) {
        console.log(`   Last Invoice Date: ${stats.lastInvoiceDate}`);
      }

      console.log("\n✅ Sage database is ready for webhook integration!");
    } else {
      console.log("❌ Connection failed!");
      console.log("\n📋 Troubleshooting:");
      console.log("   1. Verify server IP and port are correct");
      console.log("   2. Check username and password");
      console.log("   3. Ensure SQL Server allows remote connections");
      console.log("   4. Check firewall settings");
    }

    await sageDb.disconnect();
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("\n📋 Configuration Help:");
    console.error("   1. Run: npm run setup");
    console.error("   2. Open: http://localhost:8080");
    console.error("   3. Fill in your Sage database details");
    console.error("   4. Test and save configuration");
  }
}

// Run the test
testConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error.message);
    process.exit(1);
  });
