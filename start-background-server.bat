@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server (Background)
echo =====================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Node.js is available
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js not found
    echo 📋 Please run SIMPLE-SETUP.bat first
    pause
    exit /b 1
)

REM Check if server files exist
if not exist "dist\unifiedServer.js" (
    echo ❌ Server not built
    echo 📋 Please run SIMPLE-SETUP.bat first
    pause
    exit /b 1
)

echo 🚀 Starting Sage ERP Webhook Server in background...
echo.

REM Start server in background using PowerShell
powershell -WindowStyle Hidden -Command "& {Set-Location '%~dp0'; node dist\unifiedServer.js}" &

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

REM Check if server is responding
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/health' -TimeoutSec 5 | Out-Null; exit 0 } catch { exit 1 }"

if %errorLevel% == 0 (
    echo ✅ Server started successfully in background!
    echo.
    echo 🌐 Web interface: http://localhost:3000
    echo 📊 Database viewer: http://localhost:3000/database
    echo 💚 Health status: http://localhost:3000/health
    echo.
    echo 💡 The server is now running in the background
    echo 💡 You can close this window - server will keep running
    echo 💡 To stop: Run "stop-webhook-server.bat"
    echo.
    
    REM Ask if they want to open web interface
    set /p "openBrowser=Open web interface now? (y/n): "
    if /i "%openBrowser%"=="y" (
        start http://localhost:3000
    )
) else (
    echo ❌ Server failed to start
    echo 📋 Please check if port 3000 is available
    echo.
)

pause
