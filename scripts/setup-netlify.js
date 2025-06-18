#!/usr/bin/env node

/**
 * Netlify Setup Script
 * This script helps you set up your project for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Netlify deployment...\n');

// Check if netlify.toml exists
const netlifyTomlPath = path.join(process.cwd(), 'netlify.toml');
const simpleTomlPath = path.join(process.cwd(), 'netlify.simple.toml');

if (!fs.existsSync(netlifyTomlPath)) {
  if (fs.existsSync(simpleTomlPath)) {
    console.log('📋 Copying simple netlify configuration...');
    fs.copyFileSync(simpleTomlPath, netlifyTomlPath);
    console.log('✅ netlify.toml created from simple template');
  } else {
    console.log('❌ No netlify configuration found');
    process.exit(1);
  }
}

// Check environment files
console.log('\n📁 Checking environment files...');

const envFiles = [
  { file: '.env.example', required: true, description: 'Environment template' },
  { file: '.env.production', required: false, description: 'Production environment' },
  { file: '.env.staging', required: false, description: 'Staging environment' }
];

envFiles.forEach(({ file, required, description }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - ${description}`);
  } else if (required) {
    console.log(`❌ ${file} - ${description} (REQUIRED)`);
  } else {
    console.log(`⚠️  ${file} - ${description} (optional)`);
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');

const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['build', 'start:prod', 'deploy'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script} script found`);
    } else {
      console.log(`❌ ${script} script missing`);
    }
  });
}

// Display next steps
console.log('\n🎯 Next Steps for Netlify Deployment:');
console.log('');
console.log('1. 🌐 Go to https://netlify.com and create an account');
console.log('2. 🔗 Connect your GitHub repository');
console.log('3. ⚙️  Configure build settings:');
console.log('   - Build command: npm run build');
console.log('   - Publish directory: dist');
console.log('4. 🔐 Set environment variables in Netlify dashboard:');
console.log('   - DATABASE_URL');
console.log('   - DIRECT_URL');
console.log('   - JWT_SECRET');
console.log('   - SUPABASE_URL');
console.log('   - SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('5. 🚀 Deploy your site!');
console.log('');
console.log('📚 For detailed instructions, see DEPLOYMENT.md');
console.log('');
console.log('✨ Happy deploying!');
