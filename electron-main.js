const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
let webhookServer;
let serverPort = 3000;

// Enable live reload for development
if (process.env.NODE_ENV === "development") {
  require("electron-reload")(__dirname);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.js"),
    },
    icon: path.join(__dirname, "assets", "icon.ico"), // Windows icon
    title: "Sage ERP Webhook Server",
    autoHideMenuBar: true, // Hide menu bar for cleaner look
    show: false, // Don't show until ready
  });

  // Start the webhook server
  startWebhookServer();

  // Load the webhook server URL
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
    mainWindow.show();

    // Show welcome message
    mainWindow.webContents.once("did-finish-load", () => {
      showWelcomeMessage();
    });
  }, 3000);

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
    stopWebhookServer();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function startWebhookServer() {
  try {
    console.log("🚀 Starting webhook server...");

    // Start the Node.js webhook server
    webhookServer = spawn(
      "node",
      [path.join(__dirname, "dist", "unifiedServer.js")],
      {
        cwd: __dirname,
        env: { ...process.env, PORT: serverPort },
      }
    );

    webhookServer.stdout.on("data", (data) => {
      console.log(`Webhook: ${data}`);
    });

    webhookServer.stderr.on("data", (data) => {
      console.error(`Webhook Error: ${data}`);
    });

    webhookServer.on("close", (code) => {
      console.log(`Webhook server exited with code ${code}`);
    });
  } catch (error) {
    console.error("Failed to start webhook server:", error.message);
    showErrorDialog("Failed to start webhook server", error.message);
  }
}

function stopWebhookServer() {
  if (webhookServer) {
    webhookServer.kill();
    webhookServer = null;
  }
}

function showWelcomeMessage() {
  const welcomeMessage = `
🎉 Welcome to Sage ERP Webhook Server!

✅ Server is now running locally on your computer
🌐 Web interface is ready for configuration
🔧 Configure your Sage database connection
📊 Monitor orders and view data in real-time

Next steps:
1. Configure your Sage database connection
2. Test the connection
3. Set up ngrok or configure your firewall
4. Add webhook URL to OdaFlow

The server will continue running even if you close this window.
  `;

  dialog
    .showMessageBox(mainWindow, {
      type: "info",
      title: "Sage ERP Webhook Server",
      message: "Welcome to Sage ERP Webhook Server!",
      detail: welcomeMessage,
      buttons: ["Get Started", "Learn More"],
      defaultId: 0,
    })
    .then((result) => {
      if (result.response === 1) {
        // Open documentation
        shell.openExternal(
          "https://github.com/DV-Tech-Ventures/sage-web-server"
        );
      }
    });
}

function showErrorDialog(title, message) {
  dialog.showErrorBox(title, message);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopWebhookServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopWebhookServer();
});

// IPC handlers for communication with renderer
ipcMain.handle("get-server-status", async () => {
  return {
    running: webhookServer !== null,
    port: serverPort,
    url: `http://localhost:${serverPort}`,
  };
});

ipcMain.handle("restart-server", async () => {
  stopWebhookServer();
  setTimeout(startWebhookServer, 1000);
  return { success: true };
});

ipcMain.handle("open-external", async (event, url) => {
  shell.openExternal(url);
});

// Auto-updater (for future versions)
if (process.env.NODE_ENV === "production") {
  const { autoUpdater } = require("electron-updater");

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update Available",
      message:
        "A new version is available. It will be downloaded in the background.",
      buttons: ["OK"],
    });
  });
}
