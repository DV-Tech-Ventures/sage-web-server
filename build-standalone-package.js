/**
 * Build Standalone Windows Package (No Node.js Installation Required)
 * Uses pkg to bundle Node.js runtime with the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Building Standalone Windows Package (No Node.js Required)...\n');

const packageName = 'SageWebhookServer-v2.2.0-Standalone';
const packageDir = path.join(__dirname, packageName);

async function buildStandalonePackage() {
  try {
    // Step 1: Clean and create package directory
    console.log('🧹 Cleaning package directory...');
    if (fs.existsSync(packageDir)) {
      fs.rmSync(packageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageDir, { recursive: true });

    // Step 2: Build TypeScript
    console.log('🔨 Building TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });

    // Step 3: Install pkg globally if not installed
    console.log('📦 Installing pkg bundler...');
    try {
      execSync('npm install -g pkg', { stdio: 'inherit' });
    } catch (error) {
      console.log('   ⚠️ pkg might already be installed');
    }

    // Step 4: Create standalone executable with Node.js bundled
    console.log('🔨 Creating standalone executable with Node.js bundled...');
    execSync('pkg dist/unifiedServer.js --targets node18-win-x64 --output SageWebhookServer.exe', { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    // Step 5: Copy executable and supporting files
    console.log('📁 Copying files to package...');
    
    const filesToCopy = [
      'SageWebhookServer.exe',
      'src/views/',
      'src/setup/',
      'config.example.json'
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
      }
    }

    // Step 6: Create simple batch files for standalone version
    console.log('📝 Creating batch files...');

    // Start server batch file
    fs.writeFileSync(path.join(packageDir, 'START-SERVER.bat'), `@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server (Standalone)
echo =====================================
echo.

cd /d "%~dp0"

echo 🚀 Starting Sage ERP Webhook Server...
echo 🌐 Web interface will be available at: http://localhost:3000
echo.
echo 💡 To configure:
echo    1. Open http://localhost:3000 in your browser
echo    2. Fill in your Sage database details
echo    3. Test connection and save
echo.
echo ⏰ Starting server (press Ctrl+C to stop)...
echo.

SageWebhookServer.exe

echo.
echo 📴 Server stopped.
pause`);

    // Background server batch file  
    fs.writeFileSync(path.join(packageDir, 'START-BACKGROUND.bat'), `@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server (Background)
echo =====================================
echo.

cd /d "%~dp0"

echo 🚀 Starting server in background...

start /b SageWebhookServer.exe

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Check if server is responding
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 5 | Out-Null; Write-Host '✅ Server started successfully!' } catch { Write-Host '❌ Server failed to start' }"

echo.
echo 🌐 Web interface: http://localhost:3000
echo 📊 Database viewer: http://localhost:3000/database  
echo 💚 Health status: http://localhost:3000/health
echo.
echo 💡 Server is running in background
echo 💡 You can close this window
echo 💡 To stop server: run STOP-SERVER.bat
echo.

set /p "openBrowser=Open web interface now? (y/n): "
if /i "%openBrowser%"=="y" (
    start http://localhost:3000
)

echo.
pause`);

    // Stop server batch file
    fs.writeFileSync(path.join(packageDir, 'STOP-SERVER.bat'), `@echo off
echo.
echo 🛑 Stopping Sage ERP Webhook Server...
echo.

taskkill /f /im SageWebhookServer.exe >nul 2>&1

for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /pid %%i /f >nul 2>&1
)

echo ✅ Server stopped
echo 🌐 http://localhost:3000 is now available
echo.
pause`);

    // Simple README
    fs.writeFileSync(path.join(packageDir, 'README.txt'), `=====================================
 Sage ERP Webhook Server v2.2.0
 STANDALONE VERSION (No Node.js Required)
=====================================

QUICK START:

1. BACKGROUND MODE (Recommended):
   - Double-click "START-BACKGROUND.bat"
   - Server runs invisibly in background
   - Configure at http://localhost:3000

2. VISIBLE MODE:
   - Double-click "START-SERVER.bat"  
   - Server window stays open
   - Configure at http://localhost:3000

3. STOP SERVER:
   - Double-click "STOP-SERVER.bat"

=====================================

FEATURES:

✅ No Node.js installation required
✅ Single executable with runtime bundled
✅ Web interface for configuration
✅ Database viewer with Excel export
✅ Real-time health monitoring
✅ Automatic Sage ERP integration

=====================================

CONFIGURATION:

1. Start server (background or visible mode)
2. Open http://localhost:3000
3. Fill in 5 fields:
   - Server: localhost
   - Database: YourSageDatabase
   - Username: sa  
   - Password: yourpassword
   - Port: 1433
4. Test connection and save
5. Done!

=====================================

REQUIREMENTS:

- Windows 7, 8, 10, or 11
- Sage ERP with SQL Server
- Internet connection
- No other software required!

=====================================`);

    // Step 7: Create ZIP file
    console.log('📦 Creating standalone ZIP package...');
    const zipCommand = process.platform === 'win32' 
      ? `powershell Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${packageName}.zip" -Force`
      : `cd "${__dirname}" && zip -r "${packageName}.zip" "${packageName}"`;
    
    execSync(zipCommand, { stdio: 'inherit' });

    // Step 8: Cleanup
    fs.unlinkSync(path.join(__dirname, 'SageWebhookServer.exe'));

    // Step 9: Success message
    console.log('\n🎉 Standalone Windows Package Created!');
    console.log('\n📦 Package Details:');
    console.log(`   File: ${packageName}.zip`);
    
    const stats = fs.statSync(`${packageName}.zip`);
    console.log(`   Size: ${Math.round(stats.size / 1024 / 1024)}MB`);
    
    console.log('\n✨ Features:');
    console.log('   ✅ Node.js runtime bundled inside .exe');
    console.log('   ✅ No Node.js installation required');
    console.log('   ✅ Background execution option');
    console.log('   ✅ Simple start/stop batch files');
    console.log('   ✅ Web interface for configuration');

    console.log('\n🎯 Manufacturer Experience:');
    console.log('   1. Extract ZIP file');
    console.log('   2. Double-click START-BACKGROUND.bat');
    console.log('   3. Configure at http://localhost:3000');
    console.log('   4. Done! No technical knowledge needed');

    console.log('\n✅ Perfect for non-technical users!');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
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
buildStandalonePackage();
