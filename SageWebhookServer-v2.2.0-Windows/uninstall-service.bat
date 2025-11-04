@echo off
echo.
echo =====================================
echo  Sage ERP Webhook Server Uninstaller
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

echo 🗑️ Uninstalling Sage ERP Webhook Server...
echo.

REM Uninstall the service
node uninstall-windows-service.js

if %errorLevel% == 0 (
    echo.
    echo =====================================
    echo ✅ Uninstall Successful!
    echo =====================================
    echo.
    echo 🗑️ Sage ERP Webhook Server has been removed
    echo 📁 You can safely delete this folder
    echo.
) else (
    echo.
    echo ❌ Uninstall failed!
    echo Please check the error messages above
    echo.
)

echo Press any key to exit...
pause >nul
