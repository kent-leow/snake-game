#!/usr/bin/env node

/**
 * Build verification script for Vercel deployment
 * This script ensures that the Next.js build works correctly with all module imports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Verifying Next.js build...');

try {
  // Clean any previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { cwd: __dirname + '/..' });
  }

  // Run the build
  console.log('📦 Running Next.js build...');
  const buildOutput = execSync('npm run build', { 
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });

  // Check for build success indicators
  const successIndicators = [
    'Compiled successfully',
    '✓ Compiled successfully',
    'Route (app)'
  ];

  const hasSuccessIndicator = successIndicators.some(indicator => 
    buildOutput.includes(indicator)
  );

  // Check for error indicators
  const errorIndicators = [
    'Module not found',
    "Can't resolve",
    'Build failed',
    'Error:',
    'Failed to compile',
    'webpack errors'
  ];

  const hasErrors = errorIndicators.some(error => 
    buildOutput.toLowerCase().includes(error.toLowerCase())
  );

  if (hasSuccessIndicator && !hasErrors) {
    console.log('✅ Build verification passed!');
    console.log('🎉 All modules are resolving correctly');
    
    // Check that essential files were created
    const essentialFiles = [
      '.next/BUILD_ID',
      '.next/build-manifest.json',
      '.next/server/app/game.html',
      '.next/server/app/scores.html'
    ];

    const missingFiles = essentialFiles.filter(file => 
      !fs.existsSync(path.join(__dirname, '..', file))
    );

    if (missingFiles.length > 0) {
      console.log('⚠️  Some expected build files are missing:', missingFiles);
    } else {
      console.log('📁 All expected build artifacts were created');
    }
    
    console.log('\n🚀 Ready for Vercel deployment!');
    
  } else {
    console.error('❌ Build verification failed');
    if (hasErrors) {
      console.error('🔍 Found error indicators in build output');
    }
    if (!hasSuccessIndicator) {
      console.error('🔍 Missing success indicators in build output');
    }
    console.log('\n📋 Build output:');
    console.log(buildOutput);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed with error:', error.message);
  console.log('\n📋 Full error output:');
  console.log(error.stdout || error.message);
  process.exit(1);
}