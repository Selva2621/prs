#!/usr/bin/env node

/**
 * Debug Build Script
 * This script helps diagnose TypeScript compilation issues
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging TypeScript compilation issues...\n');

// Check if all required files exist
function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  
  const requiredFiles = [
    'tsconfig.json',
    'tsconfig.build.json',
    'src/main.ts',
    'src/app.module.ts',
    'src/app.controller.ts',
    'src/app.service.ts',
    'src/config/prisma.service.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Check TypeScript configuration
function checkTsConfig() {
  console.log('\n⚙️ Checking TypeScript configuration...');
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    const tsconfigBuild = JSON.parse(fs.readFileSync('tsconfig.build.json', 'utf8'));
    
    console.log('✅ tsconfig.json is valid JSON');
    console.log('✅ tsconfig.build.json is valid JSON');
    
    console.log('\nCompiler options:');
    console.log(`- Target: ${tsconfig.compilerOptions.target}`);
    console.log(`- Module: ${tsconfig.compilerOptions.module}`);
    console.log(`- Output directory: ${tsconfig.compilerOptions.outDir}`);
    
    return true;
  } catch (error) {
    console.log('❌ TypeScript configuration error:', error.message);
    return false;
  }
}

// Check Prisma client
function checkPrismaClient() {
  console.log('\n🔧 Checking Prisma client...');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated successfully');
    return true;
  } catch (error) {
    console.log('❌ Prisma client generation failed');
    return false;
  }
}

// Run TypeScript compilation with detailed output
function runTypeScriptCompilation() {
  console.log('\n🏗️ Running TypeScript compilation with detailed output...');
  
  try {
    // First, try with --noEmit to check for errors without generating files
    console.log('Checking for TypeScript errors...');
    execSync('npx tsc -p tsconfig.build.json --noEmit', { stdio: 'inherit' });
    console.log('✅ No TypeScript errors found');
    
    // Now try actual compilation
    console.log('\nCompiling TypeScript...');
    execSync('npx tsc -p tsconfig.build.json --listFiles', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful');
    
    return true;
  } catch (error) {
    console.log('❌ TypeScript compilation failed');
    console.log('Exit code:', error.status);
    return false;
  }
}

// Check build output
function checkBuildOutput() {
  console.log('\n📦 Checking build output...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const mainFile = path.join(distPath, 'main.js');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ dist directory not found');
    return false;
  }
  
  console.log('✅ dist directory exists');
  
  const files = fs.readdirSync(distPath);
  console.log(`📁 dist directory contains ${files.length} files:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  if (fs.existsSync(mainFile)) {
    console.log('✅ main.js found');
    return true;
  } else {
    console.log('❌ main.js not found');
    return false;
  }
}

// Main diagnostic function
async function diagnose() {
  console.log('🚀 Starting build diagnostics...\n');
  
  let success = true;
  
  // Step 1: Check files
  if (!checkRequiredFiles()) {
    success = false;
  }
  
  // Step 2: Check TypeScript config
  if (!checkTsConfig()) {
    success = false;
  }
  
  // Step 3: Check Prisma
  if (!checkPrismaClient()) {
    success = false;
  }
  
  // Step 4: Try TypeScript compilation
  if (!runTypeScriptCompilation()) {
    success = false;
  }
  
  // Step 5: Check output
  if (!checkBuildOutput()) {
    success = false;
  }
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 All checks passed! Build should work.');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
  }
  console.log('='.repeat(50));
}

// Run diagnostics
if (require.main === module) {
  diagnose();
}

module.exports = { diagnose };
