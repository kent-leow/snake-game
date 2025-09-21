#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== Vercel Build Debug Script ===');
console.log(`Node.js version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`__dirname: ${__dirname}`);

// Check key paths
const keyPaths = [
  'src/components/index.ts',
  'src/hooks/index.ts', 
  'src/lib/index.ts',
  'src/lib/game/index.ts',
  'src/app/scores/page.tsx',
  'tsconfig.json',
  'package.json'
];

console.log('\n=== Checking Key Files ===');
keyPaths.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✓' : '✗'} ${filePath} - ${exists ? 'EXISTS' : 'MISSING'}`);
  
  if (exists && filePath.endsWith('.ts')) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`  - ${lines} lines`);
    } catch (error) {
      console.log(`  - Error reading: ${error.message}`);
    }
  }
});

// Check tsconfig paths
console.log('\n=== Checking TypeScript Configuration ===');
try {
  const tsconfigPath = path.resolve('tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  console.log('Base URL:', tsconfig.compilerOptions?.baseUrl);
  console.log('Paths:', JSON.stringify(tsconfig.compilerOptions?.paths, null, 2));
} catch (error) {
  console.log('Error reading tsconfig:', error.message);
}

// Check import statements in scores page
console.log('\n=== Checking Scores Page Imports ===');
try {
  const scoresPath = path.resolve('src/app/scores/page.tsx');
  const content = fs.readFileSync(scoresPath, 'utf8');
  const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
  importLines.forEach(line => {
    console.log(`Import: ${line.trim()}`);
  });
} catch (error) {
  console.log('Error reading scores page:', error.message);
}

// Check exports in index files
console.log('\n=== Checking Index File Exports ===');
const indexFiles = ['src/components/index.ts', 'src/hooks/index.ts', 'src/lib/index.ts'];
indexFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    const exportLines = content.split('\n').filter(line => 
      line.trim().startsWith('export') && !line.includes('//')
    );
    console.log(`\n${filePath}:`);
    exportLines.slice(0, 5).forEach(line => {
      console.log(`  ${line.trim()}`);
    });
    if (exportLines.length > 5) {
      console.log(`  ... and ${exportLines.length - 5} more exports`);
    }
  } catch (error) {
    console.log(`Error reading ${filePath}:`, error.message);
  }
});

console.log('\n=== Debug Complete ===');