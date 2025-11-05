=====================================
 Sage ERP Webhook Server v2.2.0
 SIMPLE INSTALLATION GUIDE
=====================================

QUICK START (3 Steps):

1. SETUP (One-time):
   - Double-click "SIMPLE-SETUP.bat"
   - It will install Node.js dependencies automatically
   - Wait for "Setup Complete" message

2. START SERVER:
   - Double-click "start-webhook-server.bat"
   - Server starts and shows web interface URL
   - Keep this window open while using

3. CONFIGURE:
   - Open http://localhost:3000 in your browser
   - Fill in your Sage database details (5 fields)
   - Test connection and save
   - Done!

=====================================

WHAT YOU GET:

✅ Web interface for configuration
✅ Database viewer with Excel export  
✅ Real-time health monitoring
✅ Automatic order processing from OdaFlow
✅ Professional dashboard and statistics

=====================================

REQUIREMENTS:

- Windows 7, 8, 10, or 11
- Sage ERP with SQL Server database
- Internet connection
- Administrator rights (for setup only)

=====================================

TROUBLESHOOTING:

Problem: "Node.js not found"
Solution: Install Node.js from https://nodejs.org

Problem: "Dependencies failed"  
Solution: Check internet connection, run setup again

Problem: "Server won't start"
Solution: Check if port 3000 is available

Problem: "Can't connect to database"
Solution: Verify Sage SQL Server is running

=====================================

FOR ODAFLOW INTEGRATION:

1. Get external URL:
   - Download ngrok from https://ngrok.com
   - Run: ngrok http 3000
   - Copy the HTTPS URL

2. Configure in OdaFlow:
   - Add the ngrok URL as webhook endpoint
   - Test by approving an order
   - Check database viewer for results

=====================================

SUPPORT:

- GitHub: https://github.com/DV-Tech-Ventures/sage-web-server
- Web Interface: http://localhost:3000
- Database Viewer: http://localhost:3000/database
- Health Status: http://localhost:3000/health

=====================================
