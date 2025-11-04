@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server Installer
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

echo 📦 Installing Sage ERP Webhook Server as Windows service...
echo.

REM Install the service
node create-windows-service.js

if %errorLevel% == 0 (
    echo.
    echo =====================================
    echo ✅ Installation Successful!
    echo =====================================
    echo.
    echo 🌐 Web interface: http://localhost:3000
    echo ⚙️ Configure your Sage database via the web interface
    echo 🔧 Service name: Sage ERP Webhook Server
    echo 📊 Check Windows Services to manage the service
    echo.
    echo 💡 Next steps:
    echo 1. Double-click "open-web-interface.bat" to configure
    echo 2. Fill in your Sage database details
    echo 3. Test the connection
    echo 4. Set up ngrok for external access
    echo.
) else (
    echo.
    echo ❌ Installation failed!
    echo Please check the error messages above
    echo.
)

echo Press any key to exit...
pause >nul
