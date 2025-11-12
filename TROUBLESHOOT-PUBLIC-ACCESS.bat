@echo off
echo.
echo =====================================
echo  Troubleshoot Public Access Issues
echo =====================================
echo.

cd /d "%~dp0"

echo 🔍 Diagnosing webhook server public access...
echo.

echo 📋 Step 1: Check if server is running locally...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/health' -TimeoutSec 5; Write-Host '✅ Local server is running'; Write-Host '   Status:' $response.StatusCode } catch { Write-Host '❌ Local server not responding' }"

echo.
echo 📋 Step 2: Check if port 3000 is listening...
netstat -an | findstr ":3000"
if %errorLevel% == 0 (
    echo ✅ Port 3000 is listening
) else (
    echo ❌ Port 3000 is not listening - server not started
)

echo.
echo 📋 Step 3: Check Windows Firewall rule...
netsh advfirewall firewall show rule name="Sage Webhook Server"
if %errorLevel% == 0 (
    echo ✅ Firewall rule exists
) else (
    echo ❌ Firewall rule not found
    echo 💡 Run FIREWALL-SETUP.bat as administrator
)

echo.
echo 📋 Step 4: Get your actual public IP...
for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org' -UseBasicParsing).Content"') do set PUBLIC_IP=%%i
echo ✅ Your public IP: %PUBLIC_IP%

echo.
echo 📋 Step 5: Test local network access...
echo 🔍 Testing if other devices on your network can reach the server...
echo 💡 Try this URL from another device on the same WiFi:
echo    http://%PUBLIC_IP%:3000

echo.
echo 📋 Step 6: Common Issues and Solutions...
echo.
echo ❌ "Connection refused" - Possible causes:
echo    1. Server not running → Run start-background-server.bat
echo    2. Wrong IP address → Use %PUBLIC_IP% instead of 41.90.121.217
echo    3. Router blocking → Check router firewall settings
echo    4. ISP blocking → Contact internet provider
echo.
echo ❌ "Server not listening on 0.0.0.0" - Solution:
echo    1. Stop current server → Run STOP-SERVER.bat
echo    2. Restart with public binding → Run start-background-server.bat
echo.
echo ✅ Working URLs to test:
echo    Local: http://localhost:3000
echo    Network: http://%PUBLIC_IP%:3000
echo    Webhook: http://%PUBLIC_IP%:3000/receive-order
echo.

pause
