=====================================
 Sage ERP Webhook Server v2.2.0
=====================================

INSTALLATION INSTRUCTIONS:

1. INSTALL SERVICE:
   - Right-click "install-service.bat"
   - Select "Run as administrator"
   - Wait for "Installation Successful" message

2. CONFIGURE DATABASE:
   - Double-click "open-web-interface.bat"
   - Fill in 5 fields:
     * Server: localhost (or your SQL Server IP)
     * Database: YourSageDatabase
     * Username: sa
     * Password: yourpassword
     * Port: 1433
   - Click "Test Connection"
   - Click "Save Configuration"

3. SETUP EXTERNAL ACCESS (for OdaFlow):
   - Download ngrok: https://ngrok.com/download
   - Run: ngrok http 3000
   - Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   - Configure this URL in OdaFlow webhook settings

4. TEST INTEGRATION:
   - Approve an order in OdaFlow
   - Check the database viewer at http://localhost:3000/database
   - Orders should appear automatically!

=====================================

WHAT THIS DOES:

- Receives order data from OdaFlow
- Transforms to Sage ERP format
- Saves directly to your Sage SQL Server
- Provides web interface for monitoring
- Runs as Windows service (background)

=====================================

REQUIREMENTS:

- Windows 7, 8, 10, or 11
- Sage ERP with SQL Server database
- Internet connection
- Administrator rights (for service installation)

=====================================

SUPPORT:

- Web interface: http://localhost:3000
- Database viewer: http://localhost:3000/database
- Health status: http://localhost:3000/health
- GitHub: https://github.com/DV-Tech-Ventures/sage-web-server

=====================================

UNINSTALL:

- Right-click "uninstall-service.bat"
- Select "Run as administrator"
- Delete this folder when done

=====================================
