# 🔗 Sage ERP Webhook Server - Installation Guide

**Simple installation for manufacturers - no technical knowledge required!**

---

## 📥 **Step 1: Download**

1. **Go to:** https://github.com/DV-Tech-Ventures/sage-web-server/releases/latest
2. **Download:** `SageWebhookServer-v2.2.0-Windows.zip`
3. **Save** to your Downloads folder

---

## 📦 **Step 2: Extract Files**

### **Option A: Using WinRAR (Recommended)**

1. **Download WinRAR:** https://www.win-rar.com/download.html
2. **Install WinRAR** on your computer
3. **Right-click** the ZIP file → "Extract Here"
4. **Open** the extracted folder

### **Option B: Using Windows Built-in**

1. **Right-click** the ZIP file
2. **Select** "Extract All..."
3. **Choose** destination folder
4. **Click** "Extract"
5. **Open** the extracted folder

---

## 🚀 **Step 3: Start the Server**

### **Background Mode (Recommended)**

1. **Double-click** `START-BACKGROUND.bat`
2. **Wait 10 seconds** for server to start
3. **You'll see:** "✅ Server started successfully!"
4. **Server runs invisibly** in the background

### **Alternative: Visible Mode**

1. **Double-click** `START-SERVER.bat`
2. **Keep the window open** while using
3. **To stop:** Close the window or press Ctrl+C

---

## 🌐 **Step 4: Configure Database**

1. **Double-click** `open-web-interface.bat`

   - **OR** open your browser and go to: http://localhost:3000

2. **Fill in 5 fields:**

   - **Server:** `localhost` (or your SQL Server IP)
   - **Database:** Your Sage database name (e.g., `CompanyDB`)
   - **Username:** `sa` (or your SQL Server username)
   - **Password:** Your SQL Server password
   - **Port:** `1433` (default SQL Server port)

3. **Click** "Test Connection" → Should show ✅ Success!

4. **Click** "Save Configuration" → Settings saved!

---

## 🔗 **Step 5: Set Up External Access**

### **Install ngrok (For OdaFlow Integration)**

1. **Download ngrok:** https://ngrok.com/download
2. **Extract** ngrok.exe to any folder
3. **Open Command Prompt** in that folder
4. **Run:** `ngrok http 3000`
5. **Copy** the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### **Share Your Webhook URL**

**Send this information to OdaFlow team:**

```
My Sage ERP Webhook URL: https://abc123.ngrok.io/receive-order

Please configure this URL in OdaFlow webhook settings.
```

---

## ✅ **Step 6: Test Integration**

1. **Configure the webhook URL** in OdaFlow
2. **Approve an order** in OdaFlow
3. **Check your webhook server:**
   - **Database Viewer:** http://localhost:3000/database
   - **Health Status:** http://localhost:3000/health
4. **Orders should appear** in your Sage database!

---

## 🛠️ **Managing the Server**

### **Start Server:**

- **Double-click** `START-BACKGROUND.bat` (background mode)
- **OR** `START-SERVER.bat` (visible window)

### **Stop Server:**

- **Double-click** `STOP-SERVER.bat`

### **Configure Database:**

- **Double-click** `open-web-interface.bat`
- **OR** visit http://localhost:3000

### **Monitor Orders:**

- **Database Viewer:** http://localhost:3000/database
- **Health Status:** http://localhost:3000/health
- **Export Data:** Use Excel export buttons

---

## 📊 **Web Interface Features**

### **🏠 Main Dashboard** (http://localhost:3000)

- Connection status (Green = Working, Red = Issues)
- Quick actions (Test webhook, view database)
- System information

### **📊 Database Viewer** (http://localhost:3000/database)

- View all processed orders in tables
- Export to Excel/CSV
- Real-time updates every 60 seconds

### **💚 Health Status** (http://localhost:3000/health)

- System health indicators
- Database statistics
- Server uptime and performance

### **⚙️ Configuration** (http://localhost:3000/setup)

- Database connection settings
- Test connection in real-time
- Save configuration

---

## 🔧 **Troubleshooting**

### **"Server won't start"**

- **Check:** Port 3000 is available
- **Solution:** Run `STOP-SERVER.bat` first

### **"Can't connect to database"**

- **Check:** SQL Server is running
- **Check:** Database name is correct (case-sensitive)
- **Check:** Username and password are correct
- **Test:** Can you connect with SQL Server Management Studio?

### **"ngrok not working"**

- **Check:** ngrok is running (`ngrok http 3000`)
- **Check:** Firewall allows ngrok
- **Try:** Restart ngrok

### **"Orders not appearing"**

- **Check:** Database viewer at http://localhost:3000/database
- **Check:** Health status shows database connected
- **Check:** OdaFlow webhook URL is configured correctly

---

## 📞 **Getting Help**

### **Check Status:**

1. **Open:** http://localhost:3000
2. **Check:** Connection status (Green/Red)
3. **View:** Health page for detailed information

### **Support:**

- **GitHub:** https://github.com/DV-Tech-Ventures/sage-web-server
- **Issues:** Report problems on GitHub Issues
- **Documentation:** Full README on GitHub

---

## ✅ **What This Does**

**Automatic Integration:**

- **Receives orders** from OdaFlow when approved
- **Transforms data** to Sage ERP format
- **Saves directly** to your Sage SQL Server
- **Provides monitoring** via web interface
- **Exports data** for analysis

**Perfect for manufacturers who want automated Sage ERP integration with OdaFlow!**

---

## 🎯 **Quick Reference**

| Action           | File to Run                          |
| ---------------- | ------------------------------------ |
| **Start Server** | `START-BACKGROUND.bat`               |
| **Stop Server**  | `STOP-SERVER.bat`                    |
| **Configure**    | `open-web-interface.bat`             |
| **View Orders**  | Go to http://localhost:3000/database |
| **Check Health** | Go to http://localhost:3000/health   |

**Keep the extracted folder - don't delete it while using the server!**

---

**🎉 Your Sage ERP integration is now ready!**
