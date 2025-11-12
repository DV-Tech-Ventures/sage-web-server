@echo off
echo.
echo =====================================
echo  Install Sage Webhook as Windows Service
echo =====================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as administrator
) else (
    echo ❌ This script must be run as administrator
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo 🔧 Installing Sage ERP Webhook Server as Windows Service...
echo.

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
    echo ❌ Server files not found
    echo 📋 Please run SIMPLE-SETUP.bat first
    pause
    exit /b 1
)

echo 📦 Installing Windows Service...
node create-windows-service.js

if %errorLevel% == 0 (
    echo.
    echo =====================================
    echo ✅ Windows Service Installed!
    echo =====================================
    echo.
    echo 🔧 Service Details:
    echo    Name: Sage ERP Webhook Server
    echo    Status: Running automatically
    echo    Startup: Automatic (starts with Windows)
    echo.
    echo 🌐 Access Points:
    echo    Local: http://localhost:3000
    echo    Public: http://41.90.121.217:3000
    echo    Webhook: http://41.90.121.217:3000/receive-order
    echo.
    echo 💡 Service Management:
    echo    - View in Windows Services (services.msc)
    echo    - Start/Stop/Restart from Services panel
    echo    - Runs automatically on Windows startup
    echo.
    echo 📋 Next Steps:
    echo    1. Configure database at http://localhost:3000
    echo    2. Create BETA tables
    echo    3. Share webhook URL with OdaFlow
    echo    4. Service runs automatically forever!
    echo.
) else (
    echo.
    echo ❌ Service installation failed!
    echo 📋 Please check error messages above
    echo.
)

echo Press any key to exit...
pause >nul
