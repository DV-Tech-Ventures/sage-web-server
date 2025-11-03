# 🪟 Windows Installer for Sage ERP Webhook Server

## Overview

This creates a professional Windows installer (.exe) that manufacturers can download and install with one click. No technical knowledge required!

---

## 🎯 What the Installer Does

### **One-Click Installation:**
1. **Downloads** → User downloads `SageWebhookServer-Setup.exe`
2. **Installs** → Double-click installer, click Next, Next, Install
3. **Runs** → Automatically opens web interface
4. **Configures** → User fills simple form with Sage database details
5. **Ready** → Webhook server running as Windows service

### **User Experience:**
- 📥 **Download** single .exe file
- 🖱️ **Double-click** to install
- 🌐 **Web interface opens** automatically
- ⚙️ **Fill 5 fields** (server, database, username, password, port)
- ✅ **Done!** Webhook server running

---

## 🛠️ Building the Installer

### **Prerequisites:**
- Node.js installed
- Windows machine (for building Windows installer)
- Or use GitHub Actions for cross-platform building

### **Build Steps:**

```bash
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Build Electron app and installer
npm run build-electron
```

**Output:** `dist-installer/SageWebhookServer-Setup.exe`

---

## 📦 What Gets Packaged

### **Application Files:**
- ✅ **Webhook server** (compiled Node.js)
- ✅ **Web interface** (HTML/CSS/JS)
- ✅ **Database drivers** (mssql package)
- ✅ **Configuration tools** (setup interface)

### **Windows Integration:**
- ✅ **Desktop shortcut** - Easy access
- ✅ **Start menu entry** - Professional appearance
- ✅ **Auto-start option** - Run on Windows startup
- ✅ **System tray** - Minimize to tray
- ✅ **Uninstaller** - Clean removal

### **User Interface:**
- ✅ **Native Windows app** - Looks like Windows software
- ✅ **Web interface** - Familiar browser-like experience
- ✅ **Professional design** - Clean, modern UI
- ✅ **Error handling** - User-friendly error messages

---

## 🎨 Installer Features

### **Installation Wizard:**
```
Welcome Screen
    ↓
License Agreement
    ↓
Choose Install Location
    ↓
Select Components:
  ☑️ Main Application
  ☑️ Desktop Shortcut
  ☐ Auto-start with Windows
    ↓
Installing...
    ↓
Finish:
  ☑️ Launch Sage ERP Webhook Server
  ☑️ Open Quick Start Guide
```

### **Post-Installation:**
- 🚀 **Auto-launches** application
- 🌐 **Opens web interface** in embedded browser
- 📋 **Shows quick start** guide
- ⚙️ **Ready for configuration**

---

## 👥 End User Experience

### **For Non-Technical Users:**

**Step 1: Download & Install**
```
1. Download SageWebhookServer-Setup.exe
2. Double-click to install
3. Click Next → Next → Install
4. Application opens automatically
```

**Step 2: Configure (Web Interface)**
```
1. Beautiful form opens automatically
2. Fill in 5 fields:
   - Server: localhost
   - Database: MyCompanyDB
   - Username: sa
   - Password: mypassword
   - Port: 1433
3. Click "Test Connection" → ✅ Success!
4. Click "Save Configuration" → ✅ Saved!
```

**Step 3: Integration**
```
1. Install ngrok or configure firewall
2. Get public URL for webhook
3. Add URL to OdaFlow settings
4. Done! Orders sync automatically
```

---

## 🔧 Technical Details

### **Electron Wrapper:**
- **Main Process** - Manages webhook server lifecycle
- **Renderer Process** - Displays web interface
- **IPC Communication** - Bridge between processes
- **Auto-updater** - Automatic updates from GitHub

### **Windows Service:**
- **Background operation** - Runs even when window closed
- **System tray icon** - Shows status and quick actions
- **Auto-start option** - Starts with Windows
- **Graceful shutdown** - Proper cleanup on exit

### **Packaging:**
- **NSIS Installer** - Professional Windows installer
- **Code signing** - Trusted publisher (optional)
- **Auto-updater** - Updates from GitHub releases
- **Uninstaller** - Clean removal process

---

## 🚀 Distribution

### **GitHub Releases:**
```bash
# Create release
npm run release

# Uploads to:
# https://github.com/DV-Tech-Ventures/sage-web-server/releases
```

### **Download Links:**
- **Latest Release:** Auto-generated download link
- **Direct Download:** `SageWebhookServer-Setup.exe`
- **Automatic Updates** - Users get notified of new versions

---

## 📋 Manufacturer Instructions

### **Simple Download & Install:**

**Email to manufacturers:**
```
Subject: Sage ERP Integration - One-Click Installation

Hi [Manufacturer],

Your Sage ERP integration with OdaFlow is ready! 

📥 Download: [GitHub Release Link]
🖱️ Install: Double-click the .exe file and follow the wizard
🌐 Configure: Web interface opens automatically
✅ Done: Orders sync automatically to your Sage ERP

The entire setup takes less than 5 minutes and requires no technical knowledge.

Support: [GitHub Issues Link]
Documentation: [GitHub README Link]

Best regards,
OdaFlow Team
```

---

## ✅ Benefits for Manufacturers

### **Before (Technical):**
```
❌ Install Node.js
❌ Install Git
❌ Clone repository
❌ Run npm install
❌ Edit config files
❌ Run commands
❌ Technical knowledge required
```

### **After (Simple):**
```
✅ Download one .exe file
✅ Double-click to install
✅ Fill simple web form
✅ Done! No technical knowledge needed
```

---

## 🎯 Perfect Solution

**For manufacturers:**
- 📥 **One download** - Single .exe file
- 🖱️ **One-click install** - Standard Windows installer
- 🌐 **Web interface** - Familiar browser experience
- ⚙️ **Visual configuration** - No config files
- 📊 **Professional monitoring** - Beautiful dashboards
- 🔄 **Automatic updates** - Always latest version

**For you:**
- 🚀 **Easy distribution** - Send one download link
- 📞 **Less support** - Self-explanatory installer
- ✅ **Higher adoption** - No technical barriers
- 🔄 **Easy updates** - Automatic update system

---

## 🏁 Ready for Deployment

**The Windows installer makes Sage ERP integration accessible to any manufacturer, regardless of technical expertise!**

**Build the installer and share the download link - that's it!** 🎉
