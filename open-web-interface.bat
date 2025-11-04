@echo off
echo.
echo =====================================
echo  Opening Sage ERP Webhook Server
echo =====================================
echo.

echo 🌐 Opening web interface...
echo 📍 URL: http://localhost:3000
echo.

REM Open the web interface in default browser
start http://localhost:3000

echo ✅ Web interface should open in your browser
echo.
echo 💡 If it doesn't open automatically:
echo    1. Open your web browser
echo    2. Go to: http://localhost:3000
echo    3. Configure your Sage database
echo.
echo ⚙️ Configuration steps:
echo    1. Fill in server, database, username, password, port
echo    2. Click "Test Connection"
echo    3. Click "Save Configuration"
echo    4. Service is ready for webhook calls!
echo.

pause
