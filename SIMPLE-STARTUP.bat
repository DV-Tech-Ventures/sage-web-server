@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server (Simple)
echo =====================================
echo.

cd /d "%~dp0"

echo 🚀 Starting webhook server on public IP...
echo 🌐 Accessible at: http://41.90.121.217:3000
echo.

REM Check if setup was run
if not exist "dist\unifiedServer.js" (
    echo ❌ Server not built yet
    echo 📋 Running setup first...
    echo.
    call SIMPLE-SETUP.bat
    if %errorLevel% neq 0 (
        echo ❌ Setup failed
        pause
        exit /b 1
    )
)

echo ✅ Starting webhook server...
echo.
echo 💡 Web interface: http://localhost:3000
echo 💡 Public webhook: http://41.90.121.217:3000/receive-order
echo 💡 Keep this window open while using
echo.
echo 🛑 To stop: Press Ctrl+C or close this window
echo.

REM Set environment for public access
set HOST=0.0.0.0
set PORT=3000

REM Start the server (visible window)
node dist\unifiedServer.js

echo.
echo 📴 Webhook server stopped.
pause
