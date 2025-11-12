# 🌐 Router Port Forwarding Guide

**How to expose webhook server through your router for external access**

---

## ⚠️ **Why External Access Might Not Work**

### **Common Issues:**

1. **Router Firewall** - Blocks external connections
2. **ISP Blocking** - Internet provider blocks incoming connections
3. **Dynamic IP** - Public IP changes frequently
4. **Server binding** - Not listening on correct interface

---

## 🔧 **Solution: Router Port Forwarding**

### **Step 1: Access Router Settings**

1. **Find router IP:** Usually `192.168.1.1` or `192.168.0.1`
2. **Open browser:** Go to router IP
3. **Login:** Use admin credentials (often on router sticker)

### **Step 2: Configure Port Forwarding**

1. **Find:** "Port Forwarding" or "Virtual Servers" section
2. **Add rule:**
   - **Service Name:** Sage Webhook Server
   - **External Port:** 3000
   - **Internal IP:** [Computer's local IP]
   - **Internal Port:** 3000
   - **Protocol:** TCP
   - **Enable:** Yes

### **Step 3: Find Computer's Local IP**

```bash
# Run this in Command Prompt:
ipconfig | findstr IPv4
```

### **Step 4: Test External Access**

- **From outside network:** `http://[PUBLIC_IP]:3000`
- **Should work** if port forwarding is correct

---

## 🌐 **Alternative Solutions (Easier)**

### **Option 1: Cloudflare Tunnel (Recommended)**

```bash
# Download cloudflared.exe
cloudflared tunnel --url localhost:3000

# Get instant HTTPS URL:
# https://random-name.trycloudflare.com/receive-order
```

**Benefits:**

- ✅ **No router configuration** needed
- ✅ **Automatic HTTPS**
- ✅ **Works anywhere**
- ✅ **Free** service

### **Option 2: ngrok (Simple)**

```bash
# Download ngrok.exe
ngrok http 3000

# Get HTTPS URL:
# https://abc123.ngrok.io/receive-order
```

**Benefits:**

- ✅ **No router setup**
- ✅ **Instant access**
- ✅ **HTTPS included**

### **Option 3: VPS/Cloud Server**

- **Deploy webhook server** to cloud (AWS, DigitalOcean, etc.)
- **Always online** - No home network issues
- **Professional** - Enterprise-grade reliability

---

## 🎯 **Recommendations**

### **For Quick Testing:**

**→ Use Cloudflare Tunnel**

- No router configuration needed
- Works immediately
- Free HTTPS domain

### **For Permanent Setup:**

**→ Router Port Forwarding + Dynamic DNS**

- Configure router once
- Use dynamic DNS service (DuckDNS, No-IP)
- Professional custom domain

### **For Enterprise:**

**→ Cloud VPS Deployment**

- Deploy to AWS/Azure/DigitalOcean
- Always online and accessible
- No home network dependencies

---

## 🔍 **Troubleshooting Steps**

### **1. Verify Local Access First**

```
http://localhost:3000 → Should work
```

### **2. Test Local Network Access**

```
http://[LOCAL_IP]:3000 → Should work from other devices on WiFi
```

### **3. Test External Access**

```
http://[PUBLIC_IP]:3000 → Might not work (router/ISP blocking)
```

### **4. Use Tunnel Solution**

```
Cloudflare/ngrok tunnel → Should work from anywhere
```

---

**🎯 Cloudflare Tunnel is the easiest solution - bypasses all router/firewall issues!**
