#!/usr/bin/env node

/**
 * Simple Build Script for Netlify
 * This script uses a step-by-step approach to identify and fix build issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCommand(command, description) {
  log(`🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    log(`❌ ${description} failed with exit code: ${error.status}`);
    return false;
  }
}

async function build() {
  log('🚀 Starting simple build process...');
  
  // Step 1: Install dependencies
  if (!runCommand('npm ci --production=false', 'Installing dependencies')) {
    process.exit(1);
  }
  
  // Step 2: Generate Prisma client
  if (!runCommand('npx prisma generate', 'Generating Prisma client')) {
    process.exit(1);
  }
  
  // Step 3: Check TypeScript without emitting files
  log('🔍 Checking TypeScript for errors...');
  try {
    execSync('npx tsc -p tsconfig.build.json --noEmit', { stdio: 'pipe' });
    log('✅ TypeScript check passed');
  } catch (error) {
    log('❌ TypeScript errors found:');
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.log(error.stderr.toString());
    
    // Try to continue with a more permissive build
    log('⚠️ Attempting build with --skipLibCheck...');
    try {
      execSync('npx tsc -p tsconfig.build.json --skipLibCheck --noEmit', { stdio: 'pipe' });
      log('✅ TypeScript check passed with --skipLibCheck');
    } catch (skipError) {
      log('❌ TypeScript errors persist even with --skipLibCheck');
      process.exit(1);
    }
  }
  
  // Step 4: Compile TypeScript
  log('🏗️ Compiling TypeScript...');
  try {
    execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit' });
    log('✅ TypeScript compilation successful');
  } catch (error) {
    log('❌ TypeScript compilation failed, trying with --skipLibCheck...');
    try {
      execSync('npx tsc -p tsconfig.build.json --skipLibCheck', { stdio: 'inherit' });
      log('✅ TypeScript compilation successful with --skipLibCheck');
    } catch (skipError) {
      log('❌ TypeScript compilation failed completely');
      process.exit(1);
    }
  }
  
  // Step 5: Verify build output
  const distPath = path.join(process.cwd(), 'dist');
  const mainFile = path.join(distPath, 'main.js');
  
  if (!fs.existsSync(distPath)) {
    log('❌ dist directory not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(mainFile)) {
    log('❌ main.js not found in dist directory');
    log('📁 Contents of dist directory:');
    try {
      const files = fs.readdirSync(distPath);
      files.forEach(file => log(`  - ${file}`));
    } catch (err) {
      log('❌ Could not read dist directory');
    }
    process.exit(1);
  }
  
  log('✅ Build verification successful');
  log('🎉 Build completed successfully!');
}

// Run build
if (require.main === module) {
  build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
}

module.exports = { build };
