#!/usr/bin/env node

/**
 * Local Build Test Script
 * Run this locally to test if the build works before deploying
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runStep(command, description) {
  log(`Running: ${description}`);
  log(`Command: ${command}`);

  try {
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`${description} - SUCCESS`, 'success');
    return true;
  } catch (error) {
    log(`${description} - FAILED (exit code: ${error.status})`, 'error');
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`${description} - EXISTS`, 'success');
    return true;
  } else {
    log(`${description} - MISSING`, 'error');
    return false;
  }
}

async function testBuild() {
  log('🚀 Starting local build test...');

  // Clean previous build
  log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    log('Removed dist directory');
  }

  // Step 1: Install dependencies
  if (!runStep('npm install', 'Installing dependencies')) {
    return false;
  }

  // Step 2: Generate Prisma client
  if (!runStep('npx prisma generate', 'Generating Prisma client')) {
    return false;
  }

  // Step 3: Check TypeScript compilation
  log('🔍 Testing TypeScript compilation...');
  if (!runStep('npx tsc -p tsconfig.build.json --noEmit', 'TypeScript type checking')) {
    log('Type checking failed, trying with --skipLibCheck...');
    if (!runStep('npx tsc -p tsconfig.build.json --noEmit --skipLibCheck', 'TypeScript type checking (skipLibCheck)')) {
      return false;
    }
  }

  // Step 4: Build the project
  if (!runStep('npm run build', 'Building project')) {
    return false;
  }

  // Step 5: Verify build output
  log('🔍 Verifying build output...');

  if (!checkFile('dist', 'dist directory')) {
    return false;
  }

  if (!checkFile('dist/main.js', 'main.js file')) {
    log('📁 Contents of dist directory:');
    try {
      const files = fs.readdirSync('dist');
      files.forEach(file => log(`  - ${file}`));
    } catch (err) {
      log('Could not read dist directory', 'error');
    }
    return false;
  }

  // Check file size
  const stats = fs.statSync('dist/main.js');
  log(`main.js size: ${(stats.size / 1024).toFixed(2)} KB`);

  if (stats.size < 1000) {
    log('main.js seems too small, might be incomplete', 'error');
    return false;
  }

  log('🎉 Build test completed successfully!', 'success');
  log('Your build should work on Netlify');
  return true;
}

// Run the test
if (require.main === module) {
  testBuild().then(success => {
    if (!success) {
      log('❌ Build test failed. Fix the issues above before deploying.', 'error');
      process.exit(1);
    }
  }).catch(error => {
    log(`Unexpected error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { testBuild };
