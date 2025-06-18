#!/usr/bin/env node

/**
 * Show Environment Variables for Netlify Setup
 * This script reads your local .env file and shows you what to set in Netlify
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return null;
  }
}

function maskSensitiveValue(key, value) {
  const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
  const isSensitive = sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive));
  
  if (isSensitive && value && value.length > 8) {
    return value.substring(0, 4) + '***' + value.substring(value.length - 4);
  }
  return value;
}

function showNetlifySetup() {
  console.log('🔧 Netlify Environment Variables Setup Helper\n');
  
  // Try to load different env files
  const envFiles = ['.env', '.env.production', '.env.local'];
  let envVars = {};
  let loadedFrom = null;
  
  for (const file of envFiles) {
    const vars = loadEnvFile(file);
    if (vars && Object.keys(vars).length > 0) {
      envVars = vars;
      loadedFrom = file;
      break;
    }
  }
  
  if (!loadedFrom) {
    console.log('❌ No environment file found. Please create a .env file first.');
    console.log('📝 You can copy from .env.example:');
    console.log('   cp .env.example .env');
    return;
  }
  
  console.log(`📁 Loaded environment variables from: ${loadedFrom}\n`);
  
  // Required variables for Netlify
  const requiredVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'DIRECT_URL',
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PORT',
    'SOCKET_PORT',
    'MAX_FILE_SIZE',
    'UPLOAD_DEST',
    'JWT_EXPIRES_IN'
  ];
  
  console.log('🚀 Required Environment Variables for Netlify:\n');
  console.log('Copy these to your Netlify dashboard (Site settings → Environment variables):\n');
  
  let missingVars = [];
  
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      const maskedValue = maskSensitiveValue(varName, envVars[varName]);
      console.log(`✅ ${varName}=${maskedValue}`);
    } else {
      console.log(`❌ ${varName}=<MISSING>`);
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing Variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Please add these to your .env file first.');
  }
  
  console.log('\n📋 Netlify CLI Commands:');
  console.log('If you prefer using Netlify CLI, run these commands:\n');
  
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      const isSensitive = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'].some(s => varName.includes(s));
      const value = isSensitive ? '<your_actual_value>' : envVars[varName];
      console.log(`netlify env:set ${varName} "${value}"`);
    }
  });
  
  console.log('\n🔐 Security Notes:');
  console.log('- Never commit real secrets to your repository');
  console.log('- Use different values for staging and production');
  console.log('- Rotate secrets regularly');
  console.log('\n📚 For detailed setup instructions, see: ENVIRONMENT-SETUP.md');
}

// Run the script
if (require.main === module) {
  showNetlifySetup();
}

module.exports = { showNetlifySetup };
