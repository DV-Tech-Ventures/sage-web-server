import express from "express";
import path from "path";
import fs from "fs";
import { SageDatabaseService } from "../services/sageDatabase.service";
import { DatabaseConfig, validateDatabaseConfig } from "../config/database.config";

const app = express();
const port = 8080; // Different port from webhook server

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/**
 * Serve the setup HTML page
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "setup.html"));
});

/**
 * Get existing configuration
 */
app.get("/api/get-config", (req, res) => {
  try {
    const configPath = path.join(__dirname, "../../config.json");
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, "utf8");
      const config = JSON.parse(configContent);
      
      // Don't send password in response for security
      const safeConfig = { ...config };
      if (safeConfig.database && safeConfig.database.password) {
        safeConfig.database.password = ""; // Will be filled by form if user wants to change
      }
      
      res.json({
        success: true,
        config: safeConfig,
        configPath,
        hasExistingConfig: true,
      });
    } else {
      res.json({
        success: false,
        message: "No configuration file found",
        hasExistingConfig: false,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      hasExistingConfig: false,
    });
  }
});

/**
 * Test database connection
 */
app.post("/api/test-connection", async (req, res) => {
  try {
    const { database: dbConfig } = req.body;
    
    // Validate configuration
    const validation = validateDatabaseConfig(dbConfig);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: `Configuration invalid: ${validation.errors.join(", ")}`,
      });
    }

    console.log("🔍 Testing database connection...");
    console.log(`   Server: ${dbConfig.server}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   Username: ${dbConfig.username}`);

    // Test connection
    const sageDb = new SageDatabaseService(dbConfig);
    const connected = await sageDb.testConnection();

    if (connected) {
      console.log("✅ Connection test successful");
      
      // Get database statistics
      const stats = await sageDb.getStats();
      await sageDb.disconnect();

      res.json({
        success: true,
        message: "Connection successful",
        database: dbConfig.database,
        stats,
      });
    } else {
      console.log("❌ Connection test failed");
      await sageDb.disconnect();
      
      res.json({
        success: false,
        error: "Could not connect to database. Check your settings.",
      });
    }
  } catch (error: any) {
    console.error("❌ Connection test error:", error.message);
    res.json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Save configuration to file
 */
app.post("/api/save-config", (req, res) => {
  try {
    const newConfig = req.body;
    
    // Validate configuration
    const validation = validateDatabaseConfig(newConfig.database);
    if (!validation.valid) {
      return res.json({
        success: false,
        error: `Configuration invalid: ${validation.errors.join(", ")}`,
      });
    }

    const configPath = path.join(__dirname, "../../config.json");
    
    // If config exists, merge with existing (preserve other settings)
    let finalConfig = newConfig;
    if (fs.existsSync(configPath)) {
      try {
        const existingContent = fs.readFileSync(configPath, "utf8");
        const existingConfig = JSON.parse(existingContent);
        
        // Merge database config, preserve other settings
        finalConfig = {
          ...existingConfig,
          database: newConfig.database,
        };
        
        console.log("🔄 Updating existing configuration");
      } catch (error) {
        console.log("📝 Creating new configuration file");
      }
    }
    
    // Save configuration
    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
    
    console.log("💾 Configuration saved to:", configPath);
    console.log(`   Database: ${finalConfig.database.database}`);
    console.log(`   Server: ${finalConfig.database.server}:${finalConfig.database.port}`);
    
    res.json({
      success: true,
      message: "Configuration saved successfully",
      configPath,
      database: finalConfig.database.database,
    });
  } catch (error: any) {
    console.error("❌ Save config error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Start webhook server
 */
app.post("/api/start-webhook", (req, res) => {
  try {
    console.log("🚀 Starting webhook server...");
    
    // Check if config exists
    const configPath = path.join(__dirname, "../../config.json");
    if (!fs.existsSync(configPath)) {
      return res.json({
        success: false,
        error: "No configuration found. Please save configuration first.",
      });
    }

    res.json({
      success: true,
      message: "Webhook server will start. Check console for status.",
    });

    // Start webhook server in 2 seconds (gives time for response)
    setTimeout(() => {
      console.log("🔄 Switching to webhook server...");
      process.exit(0); // Exit setup server, webhook server will start
    }, 2000);

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Server info
 */
app.get("/api/info", (req, res) => {
  res.json({
    name: "Sage ERP Webhook Setup Server",
    version: "1.0.0",
    purpose: "Configure Sage database connection for webhook integration",
    nextStep: "Save configuration and start webhook server",
  });
});

// Start setup server
app.listen(port, () => {
  console.log("\n" + "⚙️".repeat(20));
  console.log("🔧 Sage ERP Webhook Setup Server");
  console.log("⚙️".repeat(20));
  console.log(`📋 Setup page: http://localhost:${port}`);
  console.log(`🔗 Open this URL in your browser to configure Sage database`);
  console.log("\n💡 Steps:");
  console.log("1. Fill in your Sage database details");
  console.log("2. Test the connection");
  console.log("3. Save configuration");
  console.log("4. Start webhook server");
  console.log("\n⏰ Waiting for configuration...\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("📴 Shutting down setup server...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n📴 Shutting down setup server...");
  process.exit(0);
});
