@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server Setup
echo =====================================
echo.

echo 📋 This will help you set up the Sage ERP Webhook Server
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js is not installed
    echo.
    echo 📥 Please install Node.js first:
    echo    1. Go to https://nodejs.org
    echo    2. Download the LTS version
    echo    3. Run the installer
    echo    4. Restart this script
    echo.
    echo 💡 Node.js is required to run the webhook server
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js is installed:
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorLevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Build the server
echo 🔨 Building server...
npm run build
if %errorLevel% neq 0 (
    echo ❌ Failed to build server
    pause
    exit /b 1
)

echo.
echo =====================================
echo ✅ Setup Complete!
echo =====================================
echo.
echo 🚀 To start the webhook server:
echo    Double-click "start-webhook-server.bat"
echo.
echo 🌐 Then configure your database at:
echo    http://localhost:3000
echo.
echo 📋 Next steps:
echo    1. Run start-webhook-server.bat
echo    2. Open http://localhost:3000 in browser  
echo    3. Configure your Sage database
echo    4. Set up ngrok for external access
echo    5. Add webhook URL to OdaFlow
echo.

pause
