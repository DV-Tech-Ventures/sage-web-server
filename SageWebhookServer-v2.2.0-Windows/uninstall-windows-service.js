/**
 * Uninstall Windows Service for Sage Webhook Server
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Sage ERP Webhook Server',
  script: path.join(__dirname, 'dist', 'unifiedServer.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ Sage ERP Webhook Server uninstalled successfully');
  console.log('🗑️ Service removed from Windows services');
});

// Uninstall the service
console.log('🗑️ Uninstalling Sage ERP Webhook Server...');
svc.uninstall();
