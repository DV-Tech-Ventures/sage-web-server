# 🚀 Creating GitHub Release with Windows Installer

## Steps to Create Release

### Step 1: Install Electron Builder Dependencies

```bash
cd /Users/la/Desktop/odaflow-backend/webhook-test-server
npm install electron electron-builder --save-dev
```

### Step 2: Build the Windows Installer

```bash
# Build TypeScript first
npm run build

# Build Windows installer (requires Windows or CI)
npm run build-electron
```

### Step 3: Create GitHub Release

1. **Go to:** https://github.com/DV-Tech-Ventures/sage-web-server/releases
2. **Click:** "Create a new release"
3. **Tag:** `v2.0.0`
4. **Title:** `Sage ERP Webhook Server v2.0.0 - Windows Installer`
5. **Description:** Use the content below
6. **Upload:** The generated .exe files

---

## 📝 Release Description

```markdown
# 🔗 Sage ERP Webhook Server v2.0.0

**Professional webhook server for Sage ERP integration with OdaFlow**

## 🪟 Windows Downloads (No Node.js Required)

### 📥 For Manufacturers (Recommended)

| Download | Size | Description |
|----------|------|-------------|
| **SageWebhookServer-Setup.exe** | ~50MB | Professional Windows installer |
| **SageWebhookServer-Portable.exe** | ~50MB | Portable executable (no install) |

**✨ Both include:**
- ✅ **Node.js runtime bundled** - No separate installation needed
- ✅ **Complete Sage ERP integration** - 49 header + 40 line fields
- ✅ **Beautiful web interface** - Professional configuration and monitoring
- ✅ **Database viewer** - See your data with Excel export
- ✅ **Real-time health monitoring** - Visual status dashboard

## 🚀 Quick Start

### Option 1: Professional Installer
1. Download `SageWebhookServer-Setup.exe`
2. Double-click to install
3. Follow installation wizard
4. Application launches automatically
5. Configure your Sage database (5 simple fields)
6. Done! ✅

### Option 2: Portable Version
1. Download `SageWebhookServer-Portable.exe`  
2. Double-click to run (no installation)
3. Configure your Sage database
4. Done! ✅

## 🔧 Features

- 🌐 **Web-based configuration** - No config files to edit
- 🗄️ **Real Sage database integration** - Direct SQL Server connection
- 📊 **Database viewer** - Beautiful tables with Excel export
- 💚 **Professional monitoring** - Health status and statistics
- 🛡️ **Duplicate prevention** - Handles order conflicts
- 🔄 **Auto-processing** - Orders sync automatically
- 📱 **Responsive design** - Works on all screen sizes

## 🎯 Perfect For

- **Manufacturers** using Sage ERP
- **Non-technical users** needing simple setup
- **IT administrators** requiring professional tools
- **Production environments** needing reliability

## 📋 Requirements

- **Windows OS** (7, 8, 10, 11)
- **Sage ERP** with SQL Server database
- **Internet connection** (for webhook functionality)
- **No technical knowledge required**

## 📞 Support

- **Documentation:** [GitHub README](https://github.com/DV-Tech-Ventures/sage-web-server#readme)
- **Issues:** [GitHub Issues](https://github.com/DV-Tech-Ventures/sage-web-server/issues)
- **Setup Help:** Web interface provides guidance

---

**Ready for enterprise deployment!** 🚀
```

---

## Alternative: Use GitHub Actions

Since you're on Mac, you can also set up GitHub Actions to automatically build Windows executables:

### Create `.github/workflows/build-release.yml`:

```yaml
name: Build Windows Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build TypeScript
      run: npm run build
      
    - name: Build Electron App
      run: npm run build-electron
      
    - name: Upload Release Assets
      uses: softprops/action-gh-release@v1
      with:
        files: |
          dist-installer/*.exe
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This will automatically build and upload the .exe files when you create a new tag!
