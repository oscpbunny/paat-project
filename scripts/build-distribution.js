#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PAAT Distribution Build Script');
console.log('==================================\n');

// Check if required directories exist
const requiredDirs = ['assets', 'assets/icons'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Check for icon files
const iconFiles = {
  win: 'assets/icons/icon.ico',
  mac: 'assets/icons/icon.icns', 
  linux: 'assets/icons/icon.png'
};

const missingIcons = [];
Object.entries(iconFiles).forEach(([platform, iconPath]) => {
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(`${platform}: ${iconPath}`);
  }
});

if (missingIcons.length > 0) {
  console.log('⚠️  Warning: Missing icon files:');
  missingIcons.forEach(icon => console.log(`   - ${icon}`));
  console.log('   Distribution will use default Electron icons.\n');
} else {
  console.log('✅ All icon files found\n');
}

// Build steps
const steps = [
  {
    name: 'Clean previous builds',
    command: 'npm run clean',
    optional: true
  },
  {
    name: 'TypeScript type checking',
    command: 'npm run type-check'
  },
  {
    name: 'Build React application',
    command: 'npm run build'
  },
  {
    name: 'Build Electron processes',
    command: 'npm run build:electron'
  }
];

// Execute build steps
for (const step of steps) {
  try {
    console.log(`🔧 ${step.name}...`);
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${step.name} completed\n`);
  } catch (error) {
    if (step.optional) {
      console.log(`⚠️  ${step.name} failed (optional step, continuing...)\n`);
    } else {
      console.error(`❌ ${step.name} failed!`);
      console.error(`Command: ${step.command}`);
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Get platform-specific distribution commands
const platform = process.argv[2];
const distCommands = {
  'win': 'npm run dist:win',
  'mac': 'npm run dist:mac', 
  'linux': 'npm run dist:linux',
  'all': 'npm run dist'
};

const distCommand = distCommands[platform] || distCommands['all'];

// Create distribution packages
try {
  console.log(`📦 Creating distribution packages (${platform || 'all platforms'})...`);
  execSync(distCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ Distribution packages created successfully!\n');
} catch (error) {
  console.error('❌ Distribution creation failed!');
  console.error(`Command: ${distCommand}`);
  console.error(`Error: ${error.message}`);
  
  // Provide helpful error messages
  if (error.message.includes('icon')) {
    console.log('\n💡 Hint: Make sure all required icon files are in assets/icons/');
    console.log('   Run: npm install -g electron-icon-maker');
    console.log('   Then: electron-icon-maker --input=source.png --output=assets/icons/');
  }
  
  process.exit(1);
}

// Show build results
try {
  const releaseDir = path.join(process.cwd(), 'release');
  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir);
    console.log('📁 Distribution files created:');
    files.forEach(file => {
      const filePath = path.join(releaseDir, file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   - ${file} (${sizeInMB} MB)`);
    });
  }
} catch (error) {
  console.log('⚠️  Could not list distribution files');
}

console.log('\n🎉 PAAT distribution build completed successfully!');
console.log('   Check the "release" directory for distribution packages.');
console.log('\n📋 Next steps:');
console.log('   1. Test the distribution packages on target platforms');
console.log('   2. Set up code signing certificates for trusted distribution');
console.log('   3. Configure auto-updater for seamless updates');
console.log('   4. Prepare release documentation and changelog');
