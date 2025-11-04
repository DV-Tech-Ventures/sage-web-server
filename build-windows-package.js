/**
 * Build Windows Service Package
 * Creates a ZIP file with everything needed for Windows installation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 Building Windows Service Package...\n');

const packageName = 'SageWebhookServer-v2.2.0-Windows';
const packageDir = path.join(__dirname, packageName);

async function buildPackage() {
  try {
    // Step 1: Clean and create package directory
    console.log('🧹 Cleaning package directory...');
    if (fs.existsSync(packageDir)) {
      fs.rmSync(packageDir, { recursive: true, force: true });
    }
    fs.mkdirSync(packageDir, { recursive: true });

    // Step 2: Build TypeScript
    console.log('🔨 Building TypeScript...');
    execSync('npm run build', { stdio: 'inherit' });

    // Step 3: Install production dependencies
    console.log('📦 Installing production dependencies...');
    execSync('npm install --production', { stdio: 'inherit' });

    // Step 4: Copy necessary files
    console.log('📁 Copying files...');
    
    const filesToCopy = [
      'dist/',
      'node_modules/',
      'src/views/',
      'src/setup/',
      'package.json',
      'config.example.json',
      'create-windows-service.js',
      'uninstall-windows-service.js',
      'install-service.bat',
      'uninstall-service.bat',
      'open-web-interface.bat',
      'README-WINDOWS.txt'
    ];

    for (const file of filesToCopy) {
      const srcPath = path.join(__dirname, file);
      const destPath = path.join(packageDir, file);
      
      if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
          copyDirectory(srcPath, destPath);
        } else {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
        }
        console.log(`   ✅ ${file}`);
      } else {
        console.log(`   ⚠️  ${file} not found, skipping...`);
      }
    }

    // Step 5: Create ZIP file
    console.log('\n📦 Creating ZIP package...');
    const zipCommand = process.platform === 'win32' 
      ? `powershell Compress-Archive -Path "${packageDir}\\*" -DestinationPath "${packageName}.zip" -Force`
      : `cd "${__dirname}" && zip -r "${packageName}.zip" "${packageName}"`;
    
    execSync(zipCommand, { stdio: 'inherit' });

    // Step 6: Success message
    console.log('\n🎉 Windows Service Package Created Successfully!');
    console.log('\n📦 Package Details:');
    console.log(`   File: ${packageName}.zip`);
    
    const stats = fs.statSync(`${packageName}.zip`);
    console.log(`   Size: ${Math.round(stats.size / 1024 / 1024)}MB`);
    
    console.log('\n📋 Contents:');
    console.log('   ✅ install-service.bat (run as admin to install)');
    console.log('   ✅ open-web-interface.bat (configure database)');
    console.log('   ✅ uninstall-service.bat (remove service)');
    console.log('   ✅ dist/ (compiled server code)');
    console.log('   ✅ node_modules/ (all dependencies)');
    console.log('   ✅ README-WINDOWS.txt (instructions)');

    console.log('\n🎯 For Manufacturers:');
    console.log('   1. Download and extract the ZIP file');
    console.log('   2. Right-click install-service.bat → Run as administrator');
    console.log('   3. Double-click open-web-interface.bat');
    console.log('   4. Configure Sage database via web form');
    console.log('   5. Done! Service runs automatically');

    console.log('\n✅ Ready for distribution to manufacturers!');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Helper function to copy directories recursively
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run the build
buildPackage();
