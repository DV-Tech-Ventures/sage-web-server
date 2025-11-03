const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  getServerStatus: () => ipcRenderer.invoke("get-server-status"),
  restartServer: () => ipcRenderer.invoke("restart-server"),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // Add system information
  platform: process.platform,
  version: process.versions.electron,

  // Add app information
  appVersion: require("./package.json").version,
  appName: "Sage ERP Webhook Server",
});
