# 🚀 Webhook Server Startup Options

**Different ways to run the webhook server for manufacturers**

---

## 🎯 **Startup Options Comparison**

| Method | Auto-Start | Background | Survives Reboot | Best For |
|--------|------------|------------|-----------------|----------|
| **Windows Service** | ✅ Yes | ✅ Yes | ✅ Yes | Production |
| **Background Batch** | ❌ Manual | ✅ Yes | ❌ No | Testing |
| **Visible Window** | ❌ Manual | ❌ No | ❌ No | Development |

---

## 🏢 **Option 1: Windows Service (Recommended for Production)**

### **Setup:**
```bash
1. Right-click INSTALL-WINDOWS-SERVICE.bat → Run as administrator
2. Service installs and starts automatically
3. Runs forever, starts with Windows
```

### **Benefits:**
- ✅ **Starts with Windows** - Automatic on boot
- ✅ **Runs in background** - No visible windows
- ✅ **Survives reboots** - Always available
- ✅ **Professional** - Enterprise-grade deployment
- ✅ **Service management** - Control via Windows Services

### **Management:**
- **View:** Windows Services (services.msc)
- **Control:** Start/Stop/Restart from Services panel
- **Logs:** Windows Event Viewer
- **Uninstall:** Run uninstall-service.bat

---

## 🧪 **Option 2: Background Process (Good for Testing)**

### **Setup:**
```bash
Double-click start-background-server.bat
```

### **Benefits:**
- ✅ **Runs in background** - No visible window
- ✅ **Immediate start** - No installation needed
- ⚠️ **Manual restart** - Must run after reboot
- ⚠️ **Process dependent** - Stops if user logs out

### **Management:**
- **Stop:** Run STOP-SERVER.bat
- **Restart:** Run start-background-server.bat again
- **Status:** Check Task Manager for node.exe

---

## 👀 **Option 3: Visible Window (Development Only)**

### **Setup:**
```bash
Double-click START-SERVER.bat
```

### **Benefits:**
- ✅ **See logs** - Visible console output
- ✅ **Easy debugging** - Real-time monitoring
- ❌ **Visible window** - Must keep open
- ❌ **Manual management** - Start/stop manually

---

## 🎯 **Recommendations by Use Case**

### **For Production Manufacturers:**
**→ Use Windows Service**
- Install once, runs forever
- Starts automatically with Windows
- Professional deployment
- No daily management needed

### **For Testing/Development:**
**→ Use Background Process**
- Quick to start/stop
- Easy to restart for updates
- Good for configuration testing
- Manual control

### **For Troubleshooting:**
**→ Use Visible Window**
- See real-time logs
- Debug connection issues
- Monitor webhook calls
- Development and testing

---

## 🔧 **Windows Service Details**

### **Service Configuration:**
- **Name:** Sage ERP Webhook Server
- **Description:** Webhook server for Sage ERP integration with OdaFlow
- **Startup Type:** Automatic
- **Account:** Local System
- **Dependencies:** None

### **What It Does:**
- **Starts with Windows** - No manual intervention
- **Runs in background** - No user interaction needed
- **Recovers from crashes** - Automatic restart on failure
- **Logs to Event Viewer** - Professional logging
- **Survives user logout** - Always running

### **Service Management:**
```bash
# View service status
services.msc

# Command line management
sc query "Sage ERP Webhook Server"
sc start "Sage ERP Webhook Server"  
sc stop "Sage ERP Webhook Server"
```

---

## 📊 **Recommended Production Setup**

### **One-Time Setup:**
1. **Extract webhook server** ZIP file
2. **Run SIMPLE-SETUP.bat** (install dependencies)
3. **Configure database** (web interface)
4. **Run FIREWALL-SETUP.bat** (open port 3000)
5. **Run INSTALL-WINDOWS-SERVICE.bat** (permanent installation)

### **Result:**
- ✅ **Webhook server runs automatically** on Windows startup
- ✅ **Always available** at http://41.90.121.217:3000
- ✅ **No daily management** required
- ✅ **Professional deployment** as Windows service

### **OdaFlow Configuration:**
- **Webhook URL:** `http://41.90.121.217:3000/receive-order`
- **Always online** - Service runs 24/7
- **Reliable** - Automatic restart on failure

---

**🎯 Windows Service is the perfect solution for manufacturers who want "set it and forget it" webhook integration!**
