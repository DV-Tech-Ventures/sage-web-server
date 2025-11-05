@echo off
echo.
echo =====================================
echo  Stop Sage ERP Webhook Server
echo =====================================
echo.

echo 🛑 Stopping Sage ERP Webhook Server...

REM Kill any Node.js processes running the webhook server
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "unifiedServer"') do (
    echo 🔍 Found webhook server process: %%i
    taskkill /pid %%i /f
)

REM More aggressive approach - kill all node processes on port 3000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3000"') do (
    echo 🔍 Found process on port 3000: %%i
    taskkill /pid %%i /f >nul 2>&1
)

echo.
echo ✅ Webhook server stopped
echo 🌐 http://localhost:3000 is now available
echo.

pause
