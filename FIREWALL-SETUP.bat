@echo off
echo.
echo =====================================
echo  Windows Firewall Setup for Webhook
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

echo 🔧 Configuring Windows Firewall for webhook server...
echo.

REM Add firewall rule for inbound connections on port 3000
netsh advfirewall firewall add rule name="Sage Webhook Server" dir=in action=allow protocol=TCP localport=3000

if %errorLevel% == 0 (
    echo ✅ Firewall rule added successfully!
    echo.
    echo 📡 Port 3000 is now open for incoming connections
    echo 🌐 External devices can now access your webhook server
    echo.
    echo 💡 Your webhook URL for OdaFlow:
    for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"') do echo    http://%%i:3000/receive-order
    echo.
) else (
    echo ❌ Failed to add firewall rule
    echo 📋 Please manually add port 3000 to Windows Firewall
    echo.
)

echo Press any key to exit...
pause >nul
