#!/usr/bin/env node

/**
 * Netlify Build Script for NestJS
 * Handles the specific requirements for building a NestJS application on Netlify
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}[${new Date().toISOString()}] ${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check Node.js version
function checkNodeVersion() {
  logStep('NODE', 'Checking Node.js version...');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  log(`Node.js version: ${nodeVersion}`, 'blue');
  
  if (majorVersion < 20) {
    logWarning(`Node.js ${nodeVersion} detected. NestJS v11+ requires Node.js 20+`);
    logWarning('Some packages may show engine warnings but should still work');
  } else {
    logSuccess(`Node.js ${nodeVersion} is compatible`);
  }
}

// Install dependencies with proper flags
function installDependencies() {
  logStep('DEPS', 'Installing dependencies...');
  
  try {
    // Force install all dependencies including devDependencies
    execSync('npm ci --production=false --legacy-peer-deps', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    logSuccess('Dependencies installed successfully');
  } catch (error) {
    logError('Failed to install dependencies');
    
    // Try alternative installation method
    logStep('DEPS', 'Trying alternative installation...');
    try {
      execSync('npm install --legacy-peer-deps', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'development' }
      });
      logSuccess('Dependencies installed with alternative method');
    } catch (altError) {
      logError('All installation methods failed');
      process.exit(1);
    }
  }
}

// Validate environment variables
function validateEnvironment() {
  logStep('ENV', 'Validating environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];
  
  const optionalVars = [
    'DIRECT_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let hasErrors = false;
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      logError(`Missing required environment variable: ${varName}`);
      hasErrors = true;
    } else {
      logSuccess(`${varName} is set`);
    }
  });
  
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      logWarning(`Optional environment variable not set: ${varName}`);
    } else {
      logSuccess(`${varName} is set`);
    }
  });
  
  if (hasErrors) {
    logError('Please set all required environment variables in Netlify dashboard');
    process.exit(1);
  }
}

// Generate Prisma client
function generatePrismaClient() {
  logStep('PRISMA', 'Generating Prisma client...');
  
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    logSuccess('Prisma client generated successfully');
  } catch (error) {
    logError('Failed to generate Prisma client');
    logError('Make sure your schema.prisma file is valid');
    process.exit(1);
  }
}

// Build the NestJS application
function buildApplication() {
  logStep('BUILD', 'Building NestJS application...');
  
  try {
    // Set NODE_ENV to production for build
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    logSuccess('NestJS application built successfully');
  } catch (error) {
    logError('Failed to build NestJS application');
    process.exit(1);
  }
}

// Verify build output
function verifyBuild() {
  logStep('VERIFY', 'Verifying build output...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const mainFile = path.join(distPath, 'main.js');
  
  if (!fs.existsSync(distPath)) {
    logError('Build directory "dist" not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(mainFile)) {
    logError('Main application file "dist/main.js" not found');
    process.exit(1);
  }
  
  // Check for other important files
  const importantFiles = ['main.js'];
  const foundFiles = fs.readdirSync(distPath);
  
  log(`Build output contains ${foundFiles.length} files`, 'blue');
  
  importantFiles.forEach(file => {
    if (foundFiles.includes(file)) {
      logSuccess(`Found ${file}`);
    } else {
      logWarning(`Missing ${file}`);
    }
  });
  
  logSuccess('Build output verified');
}

// Create necessary runtime directories
function createRuntimeDirectories() {
  logStep('DIRS', 'Creating runtime directories...');
  
  const directories = [
    'dist/uploads',
    'dist/uploads/photos'
  ];
  
  directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`Created directory: ${dir}`, 'blue');
    }
  });
  
  logSuccess('Runtime directories created');
}

// Main build function
async function build() {
  log('🚀 Starting Netlify build for NestJS application...', 'cyan');
  log(`Build context: ${process.env.CONTEXT || 'unknown'}`, 'blue');
  log(`Branch: ${process.env.BRANCH || 'unknown'}`, 'blue');
  log(`Node environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  console.log('');
  
  try {
    checkNodeVersion();
    installDependencies();
    validateEnvironment();
    generatePrismaClient();
    buildApplication();
    verifyBuild();
    createRuntimeDirectories();
    
    console.log('');
    logSuccess('🎉 Build completed successfully!');
    logSuccess('Your NestJS application is ready for deployment');
    
  } catch (error) {
    console.log('');
    logError('💥 Build failed!');
    logError(error.message);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build };
