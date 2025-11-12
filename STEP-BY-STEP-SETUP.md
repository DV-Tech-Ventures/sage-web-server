# 📋 Step-by-Step Setup Guide for Manufacturers

**Exact order of operations for webhook server setup**

---

## 🎯 **Choose Your Setup Method**

### **Method A: Quick Testing (Manual Start)**

**Good for:** Testing and evaluation
**Downside:** Must restart manually after computer reboot

### **Method B: Production Service (Automatic)**

**Good for:** Permanent installation
**Benefit:** Starts automatically with Windows, runs forever

---

## 🧪 **Method A: Quick Testing Setup**

### **Step 1: Initial Setup (One-Time)**

```
1. Extract ZIP file to any folder
2. Double-click "SIMPLE-SETUP.bat"
   → Installs dependencies (wait for completion)
```

### **Step 2: Configure Database (One-Time)**

```
3. Double-click "start-background-server.bat"
   → Server starts in background
4. When prompted, type "y" to open web interface
5. Fill in your database details:
   - Server: localhost (or your SQL Server IP)
   - Database: YourSageDatabase
   - Username: sa
   - Password: yourpassword
   - Port: 1433
6. Click "Test Connection" → Should show ✅ Success
7. Click "Save Configuration" → Settings saved
8. Click "Create BETA Tables" → Creates safe testing tables
```

### **Step 3: Setup External Access (One-Time)**

```
9. Right-click "FIREWALL-SETUP.bat" → Run as administrator
   → Opens port 3000 in Windows Firewall
10. Your webhook is now accessible at:
    http://41.90.121.217:3000/receive-order
```

### **Step 4: Daily Use**

```
- Server runs in background until computer restarts
- To restart: Double-click "start-background-server.bat"
- To stop: Double-click "STOP-SERVER.bat"
- To configure: Open http://localhost:3000
```

---

## 🏢 **Method B: Production Service Setup**

### **Step 1: Initial Setup (One-Time)**

```
1. Extract ZIP file to any folder
2. Double-click "SIMPLE-SETUP.bat"
   → Installs dependencies (wait for completion)
```

### **Step 2: Configure Database (One-Time)**

```
3. Double-click "start-background-server.bat"
   → Server starts temporarily for configuration
4. When prompted, type "y" to open web interface
5. Fill in your database details (same as Method A)
6. Click "Test Connection" → Should show ✅ Success
7. Click "Save Configuration" → Settings saved
8. Click "Create BETA Tables" → Creates safe testing tables
9. Double-click "STOP-SERVER.bat" → Stop temporary server
```

### **Step 3: Install as Windows Service (One-Time)**

```
10. Right-click "INSTALL-WINDOWS-SERVICE.bat" → Run as administrator
    → Installs as Windows service (permanent)
11. Right-click "FIREWALL-SETUP.bat" → Run as administrator
    → Opens port 3000 in Windows Firewall
12. Your webhook is now accessible at:
    http://41.90.121.217:3000/receive-order
```

### **Step 4: Daily Use**

```
- Nothing! Service runs automatically forever
- Starts with Windows boot
- Survives user logout
- Always available 24/7
- Manage via Windows Services if needed
```

---

## 🎯 **Which Method Should They Use?**

### **For Testing (1-2 weeks):**

**→ Method A (Quick Testing)**

- Faster setup
- Easy to stop/start
- Good for evaluation

### **For Production (Permanent):**

**→ Method B (Windows Service)**

- Professional deployment
- Automatic operation
- No daily management

---

## 📋 **File Summary**

| File                            | Purpose                   | When to Use         |
| ------------------------------- | ------------------------- | ------------------- |
| **SIMPLE-SETUP.bat**            | Install dependencies      | First time only     |
| **start-background-server.bat** | Start server manually     | Testing/temporary   |
| **INSTALL-WINDOWS-SERVICE.bat** | Install permanent service | Production setup    |
| **FIREWALL-SETUP.bat**          | Open Windows Firewall     | One-time setup      |
| **STOP-SERVER.bat**             | Stop manual server        | When using Method A |
| **uninstall-service.bat**       | Remove Windows service    | If changing setup   |

---

## 🚀 **Recommended Flow for Manufacturers**

### **Phase 1: Testing (Method A)**

```
1. SIMPLE-SETUP.bat (dependencies)
2. start-background-server.bat (temporary server)
3. Configure via web interface
4. FIREWALL-SETUP.bat (open port)
5. Test webhook integration
6. Evaluate for 1-2 weeks
```

### **Phase 2: Production (Method B)**

```
1. STOP-SERVER.bat (stop temporary server)
2. INSTALL-WINDOWS-SERVICE.bat (permanent service)
3. Done! Runs automatically forever
```

**This gives them a testing period before permanent installation!** ✅

---

**🎯 Clear workflow: Test first with Method A, then install permanently with Method B!**
