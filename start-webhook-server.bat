@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server
echo =====================================
echo.

REM Change to the script directory
cd /d "%~dp0"
echo 📁 Working directory: %CD%

REM Check if Node.js is available
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js not found in PATH
    echo.
    echo 📋 Please install Node.js first:
    echo    1. Go to https://nodejs.org
    echo    2. Download and install Node.js
    echo    3. Restart this script
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

REM Check if required files exist
if not exist "dist\unifiedServer.js" (
    echo ❌ Server files not found!
    echo 📋 Building server files...
    
    if exist "src\unifiedServer.ts" (
        echo 🔨 Compiling TypeScript...
        npx tsc
        if %errorLevel% neq 0 (
            echo ❌ TypeScript compilation failed
            pause
            exit /b 1
        )
    ) else (
        echo ❌ Source files not found!
        echo 📁 Please ensure you extracted the ZIP file completely
        pause
        exit /b 1
    )
)

echo ✅ Server files ready

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorLevel% neq 0 (
        echo ❌ Dependency installation failed
        pause
        exit /b 1
    )
)

echo ✅ Dependencies ready
echo.
echo =====================================
echo 🚀 Starting Sage ERP Webhook Server
echo =====================================
echo.
echo 🌐 Web interface will be available at:
echo    http://localhost:3000
echo.
echo 💡 To stop the server:
echo    Press Ctrl+C in this window
echo.
echo 📋 Configure your Sage database:
echo    1. Open http://localhost:3000 in your browser
echo    2. Fill in your database details
echo    3. Test connection and save
echo    4. Set up ngrok for external access
echo.
echo ⏰ Starting server...
echo.

REM Start the server
node dist\unifiedServer.js

echo.
echo 📴 Server stopped.
pause
