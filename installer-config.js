/**
 * Electron Builder Configuration for Windows Installer
 */

module.exports = {
  "appId": "com.dvtech.sage-webhook-server",
  "productName": "Sage ERP Webhook Server",
  "directories": {
    "output": "dist-installer"
  },
  "files": [
    "dist/**/*",
    "src/**/*",
    "node_modules/**/*",
    "package.json",
    "config.example.json",
    "electron-main.js",
    "electron-preload.js",
    "assets/**/*"
  ],
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico",
    "publisherName": "DV Tech Ventures",
    "verifyUpdateCodeSignature": false
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "assets/icon.ico",
    "uninstallerIcon": "assets/icon.ico",
    "installerHeaderIcon": "assets/icon.ico",
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "Sage ERP Webhook Server",
    "include": "installer-script.nsh"
  },
  "publish": {
    "provider": "github",
    "owner": "DV-Tech-Ventures",
    "repo": "sage-web-server"
  }
};
