/**
 * Build Windows Service Package
 * Creates a ZIP file with everything needed for Windows installation
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("📦 Building Windows Service Package...\n");

const packageName = "SageWebhookServer-v2.2.0-Windows";
const packageDir = path.join(__dirname, packageName);

async function buildPackage() {
  try {
    // Step 1: Clean and create package directory
    console.log("🧹 Cleaning package directory...");
    if (fs.existsSync(packageDir)) {
      fs.rmSync(packageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageDir, { recursive: true });

    // Step 2: Build TypeScript
    console.log("🔨 Building TypeScript...");
    execSync("npm run build", { stdio: "inherit" });

    // Step 3: Install production dependencies
    console.log("📦 Installing production dependencies...");
    execSync("npm install --production", { stdio: "inherit" });

    // Step 4: Copy necessary files
    console.log("📁 Copying files...");

    const filesToCopy = [
      "dist/",
      "node_modules/",
      "src/views/",
      "src/setup/",
      "src/unifiedServer.ts",
      "package.json",
      "tsconfig.json",
      "config.example.json",
      "create-windows-service.js",
      "uninstall-windows-service.js",
      "install-service.bat",
      "uninstall-service.bat",
      "open-web-interface.bat",
      "start-webhook-server.bat",
      "start-background-server.bat",
      "stop-webhook-server.bat",
      "SIMPLE-SETUP.bat",
      "SIMPLE-STARTUP.bat",
      "FIREWALL-SETUP.bat",
      "EXPOSE-PUBLIC.bat",
      "WINDOWS-TASK-SCHEDULER.bat",
      "INSTALL-WINDOWS-SERVICE.bat",
      "HTTP-SETUP-SIMPLE.txt",
      "STEP-BY-STEP-SETUP.md",
      "STARTUP-OPTIONS.md",
      "CLOUDFLARE-TUNNEL.bat",
      "README-WINDOWS.txt",
      "README-SIMPLE.txt",
    ];

    for (const file of filesToCopy) {
      const srcPath = path.join(__dirname, file);
      const destPath = path.join(packageDir, file);

      if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
          copyDirectory(srcPath, destPath);
        } else {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
        }
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ⚠️  ${file} not found, skipping...`);
      }
    }

    // Step 5: Create ZIP file
    console.log("\n📦 Creating ZIP package...");
    const zipCommand =
      process.platform === "win32"
        ? `powershell Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${packageName}.zip" -Force`
        : `cd "${__dirname}" && zip -r "${packageName}.zip" "${packageName}"`;

    execSync(zipCommand, { stdio: "inherit" });

    // Step 6: Success message
    console.log("\n🎉 Windows Service Package Created Successfully!");
    console.log("\n📦 Package Details:");
    console.log(`   File: ${packageName}.zip`);

    const stats = fs.statSync(`${packageName}.zip`);
    console.log(`   Size: ${Math.round(stats.size / 1024 / 1024)}MB`);

    console.log("\n📋 Contents:");
    console.log("   ✅ SIMPLE-SETUP.bat (one-time dependency installation)");
    console.log("   ✅ start-background-server.bat (background mode)");
    console.log("   ✅ SIMPLE-STARTUP.bat (visible mode with auto-setup)");
    console.log("   ✅ FIREWALL-SETUP.bat (configure Windows Firewall)");
    console.log("   ✅ WINDOWS-TASK-SCHEDULER.bat (auto-start setup)");
    console.log("   ✅ STEP-BY-STEP-SETUP.md (complete instructions)");
    console.log("   ✅ dist/ (compiled server code)");
    console.log("   ✅ node_modules/ (all dependencies)");

    console.log("\n🎯 For Manufacturers (Quick Testing):");
    console.log("   1. Extract ZIP file");
    console.log("   2. Double-click SIMPLE-STARTUP.bat");
    console.log("   3. Configure at http://localhost:3000");
    console.log("   4. Server accessible at http://[PUBLIC_IP]:3000");

    console.log("\n🎯 For Production (Auto-Start):");
    console.log("   1. Configure with SIMPLE-STARTUP.bat first");
    console.log("   2. Right-click WINDOWS-TASK-SCHEDULER.bat → Run as admin");
    console.log("   3. Server starts automatically with Windows");

    console.log("\n📋 Multiple startup options included for different needs");

    console.log("\n✅ Ready for distribution to manufacturers!");
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Helper function to copy directories recursively
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the build
buildPackage();
