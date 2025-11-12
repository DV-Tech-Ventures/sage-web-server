@echo off
echo.
echo =====================================
echo  Expose Webhook Server to Public IP
echo =====================================
echo.

cd /d "%~dp0"

echo 🌐 Configuring webhook server for public access...
echo.

REM Get public IP address
echo 📍 Detecting your public IP address...
for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"') do set PUBLIC_IP=%%i

echo ✅ Your public IP address: %PUBLIC_IP%
echo.

echo 🔧 Starting webhook server on all interfaces (0.0.0.0:3000)...
echo 📡 Webhook will be accessible at: http://%PUBLIC_IP%:3000
echo.

REM Set environment variables for public access
set HOST=0.0.0.0
set PORT=3000

echo 🚀 Starting server...
echo.
echo 💡 Configure these settings in OdaFlow:
echo    Webhook URL: http://%PUBLIC_IP%:3000/receive-order
echo.
echo ⚠️ Make sure Windows Firewall allows port 3000
echo    (Windows Defender Firewall → Allow an app → Add port 3000)
echo.

REM Start the server
node dist\unifiedServer.js

echo.
echo 📴 Server stopped.
pause
