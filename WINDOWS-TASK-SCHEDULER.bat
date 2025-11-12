@echo off
echo.
echo =====================================
echo  Setup Auto-Start via Task Scheduler
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

echo 🔧 Creating Windows Task to start webhook server automatically...
echo.

REM Get current directory
set CURRENT_DIR=%~dp0
set BATCH_FILE=%CURRENT_DIR%start-background-server.bat

echo 📋 Task Details:
echo    Name: Sage ERP Webhook Server
echo    Trigger: At Windows startup
echo    Action: Run start-background-server.bat
echo    Location: %BATCH_FILE%
echo.

REM Create scheduled task
schtasks /create /tn "Sage ERP Webhook Server" /tr "\"%BATCH_FILE%\"" /sc onstart /ru SYSTEM /f

if %errorLevel% == 0 (
    echo.
    echo ✅ Task created successfully!
    echo.
    echo 🎯 What this does:
    echo    - Webhook server starts automatically when Windows boots
    echo    - Runs in background (invisible)
    echo    - Available at: http://41.90.121.217:3000/receive-order
    echo    - No daily management needed
    echo.
    echo 📊 Task Management:
    echo    - View: Task Scheduler (taskschd.msc)
    echo    - Disable: Uncheck task in Task Scheduler
    echo    - Delete: Run this script again to recreate
    echo.
    echo 💡 Next Steps:
    echo    1. Restart your computer to test auto-start
    echo    2. Check http://localhost:3000 after restart
    echo    3. Share webhook URL with OdaFlow team
    echo.
) else (
    echo.
    echo ❌ Task creation failed!
    echo 📋 Please check error messages above
    echo.
)

echo Press any key to exit...
pause >nul
