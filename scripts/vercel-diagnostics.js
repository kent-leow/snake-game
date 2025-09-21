#!/usr/bin/env node

/**
 * Vercel Deployment Diagnostic Script
 * Comprehensive check for potential Vercel build issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Running Vercel deployment diagnostics...\n');

// Environment Information
console.log('📋 Environment Information:');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`PWD: ${process.cwd()}\n`);

// Check package.json
console.log('📦 Package.json Check:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Package name: ${packageJson.name}`);
  console.log(`✅ Version: ${packageJson.version}`);
  console.log(`✅ Next.js version: ${packageJson.dependencies.next}`);
  console.log(`✅ TypeScript version: ${packageJson.devDependencies.typescript}\n`);
} catch (error) {
  console.error('❌ Failed to read package.json:', error.message);
}

// Check tsconfig.json
console.log('⚙️  TypeScript Configuration:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json exists');
  console.log(`✅ Base URL: ${tsconfig.compilerOptions.baseUrl || 'default'}`);
  if (tsconfig.compilerOptions.paths) {
    console.log('✅ Path mappings configured:');
    Object.entries(tsconfig.compilerOptions.paths).forEach(([key, value]) => {
      console.log(`   ${key} -> ${value}`);
    });
  }
  console.log('');
} catch (error) {
  console.error('❌ Failed to read tsconfig.json:', error.message);
}

// Check key barrel exports
console.log('🏗️  Barrel Export Verification:');
const barrelExports = [
  { path: 'src/lib/game/index.ts', name: '@/lib/game' },
  { path: 'src/components/index.ts', name: '@/components' },
  { path: 'src/hooks/index.ts', name: '@/hooks' },
  { path: 'src/types/index.ts', name: '@/types' }
];

barrelExports.forEach(({ path: filePath, name }) => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const exportCount = (content.match(/export/g) || []).length;
      console.log(`✅ ${name}: ${exportCount} exports found`);
    } else {
      console.log(`⚠️  ${name}: File not found at ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ ${name}: Error reading file - ${error.message}`);
  }
});
console.log('');

// Check for potential problematic imports
console.log('🔍 Import Analysis:');
const checkForProblematicImports = (dir, level = 0) => {
  if (level > 3) return; // Prevent deep recursion
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        checkForProblematicImports(itemPath, level + 1);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          
          // Check for problematic import patterns
          const problematicPatterns = [
            /import.*from\s+['"]@\/lib\/game['"]/,
            /import.*from\s+['"]@\/components['"]/,
            /import.*from\s+['"]@\/hooks['"]/
          ];
          
          problematicPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              const match = content.match(pattern);
              console.log(`   📁 ${itemPath}: ${match[0]}`);
            }
          });
        } catch (error) {
          // Skip files that can't be read
        }
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
};

checkForProblematicImports('src');
console.log('');

// Test build with specific webpack info
console.log('🔨 Build Test with Webpack Analysis:');
try {
  console.log('Running build with detailed webpack output...');
  
  // Set environment to get more detailed webpack output
  process.env.ANALYZE = 'false';
  process.env.WEBPACK_ANALYZE = 'false';
  
  const buildResult = execSync('npm run build', { 
    encoding: 'utf8',
    timeout: 120000, // 2 minute timeout
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  // Check for specific error patterns
  const errorPatterns = [
    /Module not found/i,
    /Can't resolve/i,
    /webpack.*error/i,
    /Failed to compile/i,
    /Build failed/i
  ];
  
  const hasErrors = errorPatterns.some(pattern => pattern.test(buildResult));
  
  if (hasErrors) {
    console.log('❌ Build completed but with potential issues:');
    errorPatterns.forEach(pattern => {
      const matches = buildResult.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        matches.forEach(match => console.log(`   ${match}`));
      }
    });
  } else {
    console.log('✅ Build completed successfully');
    
    // Check build artifacts
    const artifacts = [
      '.next/BUILD_ID',
      '.next/build-manifest.json',
      '.next/server/app',
      '.next/static/chunks'
    ];
    
    console.log('\n📁 Build Artifacts:');
    artifacts.forEach(artifact => {
      if (fs.existsSync(artifact)) {
        console.log(`✅ ${artifact} exists`);
      } else {
        console.log(`❌ ${artifact} missing`);
      }
    });
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Try to extract specific error information
  if (error.stdout) {
    const lines = error.stdout.split('\n');
    console.log('\n📋 Error Details:');
    lines.filter(line => 
      line.includes('Module not found') ||
      line.includes("Can't resolve") ||
      line.includes('Error:')
    ).forEach(line => console.log(`   ${line.trim()}`));
  }
}

console.log('\n🎯 Recommendations for Vercel:');
console.log('1. Ensure Node.js version matches between local and Vercel');
console.log('2. Clear Vercel build cache if issues persist');
console.log('3. Check environment variables are properly set');
console.log('4. Verify all dependencies are in package.json');
console.log('5. Consider adding vercel.json configuration if needed');

console.log('\n🚀 Next Steps:');
console.log('- If local build works but Vercel fails, check the Vercel build logs');
console.log('- Compare Node.js versions between local and Vercel');
console.log('- Try deploying with Vercel CLI for better error visibility');
console.log('- Check if any dependencies are missing from package.json');