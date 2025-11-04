/**
 * Create Windows Service for Sage Webhook Server
 * This creates a proper Windows service that runs in the background
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Sage ERP Webhook Server',
  description: 'Webhook server for Sage ERP integration with OdaFlow',
  script: path.join(__dirname, 'dist', 'unifiedServer.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: {
    name: "PORT",
    value: "3000"
  }
});

// Listen for the "install" event, which indicates the process is available as a service.
svc.on('install', function() {
  console.log('✅ Sage ERP Webhook Server installed as Windows service');
  console.log('🚀 Starting service...');
  svc.start();
});

svc.on('start', function() {
  console.log('✅ Sage ERP Webhook Server started successfully');
  console.log('🌐 Web interface available at: http://localhost:3000');
  console.log('⚙️ Configure your Sage database via the web interface');
});

svc.on('stop', function() {
  console.log('⏹️ Sage ERP Webhook Server stopped');
});

svc.on('error', function(err) {
  console.error('❌ Service error:', err.message);
});

// Install the service
console.log('📦 Installing Sage ERP Webhook Server as Windows service...');
svc.install();
