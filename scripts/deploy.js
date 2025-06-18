#!/usr/bin/env node

/**
 * Deployment Script for Netlify
 * This script handles pre-deployment tasks like database migrations,
 * environment validation, and build preparation.
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

// Environment validation
function validateEnvironment() {
  logStep('ENV', 'Validating environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  logSuccess('Environment variables validated');
}

// Check if Prisma schema is valid
function validatePrismaSchema() {
  logStep('PRISMA', 'Validating Prisma schema...');
  
  try {
    execSync('npx prisma validate', { stdio: 'inherit' });
    logSuccess('Prisma schema is valid');
  } catch (error) {
    logError('Prisma schema validation failed');
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
    process.exit(1);
  }
}

// Run database migrations (only in production)
function runMigrations() {
  if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS === 'true') {
    logStep('DB', 'Running database migrations...');
    
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      logSuccess('Database migrations completed');
    } catch (error) {
      logError('Database migrations failed');
      process.exit(1);
    }
  } else {
    logWarning('Skipping database migrations (not in production or RUN_MIGRATIONS not set)');
  }
}

// Build the application
function buildApplication() {
  logStep('BUILD', 'Building application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Application built successfully');
  } catch (error) {
    logError('Application build failed');
    process.exit(1);
  }
}

// Verify build output
function verifyBuild() {
  logStep('VERIFY', 'Verifying build output...');
  
  const distPath = path.join(process.cwd(), 'dist');
  const mainFile = path.join(distPath, 'main.js');
  
  if (!fs.existsSync(distPath)) {
    logError('Build directory not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(mainFile)) {
    logError('Main application file not found in build output');
    process.exit(1);
  }
  
  logSuccess('Build output verified');
}

// Clean up temporary files
function cleanup() {
  logStep('CLEANUP', 'Cleaning up temporary files...');
  
  try {
    // Remove any temporary files or directories
    const tempDirs = ['temp', '.temp', 'tmp'];
    tempDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
        log(`Removed ${dir} directory`, 'yellow');
      }
    });
    
    logSuccess('Cleanup completed');
  } catch (error) {
    logWarning('Cleanup failed, but continuing...');
  }
}

// Main deployment function
async function deploy() {
  log('🚀 Starting deployment process...', 'magenta');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  log('', 'reset');
  
  try {
    validateEnvironment();
    validatePrismaSchema();
    generatePrismaClient();
    runMigrations();
    buildApplication();
    verifyBuild();
    cleanup();
    
    log('', 'reset');
    logSuccess('🎉 Deployment completed successfully!');
    
  } catch (error) {
    log('', 'reset');
    logError('💥 Deployment failed!');
    logError(error.message);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Deployment Script for Netlify

Usage: node scripts/deploy.js [options]

Options:
  --help, -h          Show this help message
  --skip-migrations   Skip database migrations
  --verbose           Enable verbose logging

Environment Variables:
  NODE_ENV            Environment (development, staging, production)
  RUN_MIGRATIONS      Set to 'true' to run migrations in production
  DATABASE_URL        Database connection string
  DIRECT_URL          Direct database connection for migrations
  JWT_SECRET          JWT signing secret
  SUPABASE_URL        Supabase project URL
  SUPABASE_ANON_KEY   Supabase anonymous key

Examples:
  node scripts/deploy.js
  NODE_ENV=production RUN_MIGRATIONS=true node scripts/deploy.js
  `);
  process.exit(0);
}

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy };
