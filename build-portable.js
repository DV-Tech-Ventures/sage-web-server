/**
 * Build portable Windows executable
 * Creates a single .exe file with Node.js bundled inside
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building portable Windows executable...\n');

// Build steps
const buildSteps = [
  {
    name: 'Install pkg globally',
    command: 'npm install -g pkg'
  },
  {
    name: 'Build TypeScript',
    command: 'npm run build'
  },
  {
    name: 'Create portable executable',
    command: 'pkg dist/unifiedServer.js --targets node18-win-x64 --output SageWebhookServer-Portable.exe'
  }
];

async function runBuildSteps() {
  for (const step of buildSteps) {
    console.log(`📋 ${step.name}...`);
    
    try {
      await runCommand(step.command);
      console.log(`✅ ${step.name} completed\n`);
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('🎉 Portable executable created successfully!');
  console.log('\n📦 Output:');
  console.log('   File: SageWebhookServer-Portable.exe');
  console.log('   Size: ~50MB (includes Node.js runtime)');
  console.log('   Usage: Just run the .exe file - no installation needed!');
  console.log('\n💡 Distribution:');
  console.log('   - Send this .exe file to manufacturers');
  console.log('   - They just double-click to run');
  console.log('   - No Node.js installation required');
  console.log('   - No installer wizard needed');
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        resolve();
      }
    });
  });
}

// Create package.json for pkg
const pkgConfig = {
  "name": "sage-webhook-server-portable",
  "version": "2.0.0",
  "main": "dist/unifiedServer.js",
  "pkg": {
    "scripts": [
      "dist/**/*.js"
    ],
    "assets": [
      "src/views/**/*",
      "src/setup/**/*",
      "config.example.json"
    ],
    "targets": [
      "node18-win-x64"
    ],
    "outputPath": "."
  }
};

// Write pkg config
fs.writeFileSync('package-portable.json', JSON.stringify(pkgConfig, null, 2));

// Run build
runBuildSteps();
