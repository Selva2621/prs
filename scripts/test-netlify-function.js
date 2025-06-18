const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Netlify Function Setup...');

// Check if dist directory exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check if app.module.js exists
const appModulePath = path.join(distPath, 'src', 'app.module.js');
if (!fs.existsSync(appModulePath)) {
  console.error('❌ app.module.js not found in dist/src/');
  process.exit(1);
}

// Check if netlify function exists
const functionPath = path.join(__dirname, '..', 'netlify', 'functions', 'api.js');
if (!fs.existsSync(functionPath)) {
  console.error('❌ Netlify function not found at netlify/functions/api.js');
  process.exit(1);
}

console.log('✅ dist directory exists');
console.log('✅ app.module.js exists');
console.log('✅ Netlify function exists');

// Test if we can require the modules
try {
  console.log('🔍 Testing module imports...');
  
  // Test app module import
  const { AppModule } = require(appModulePath);
  console.log('✅ AppModule import successful');
  
  // Test function import
  const { handler } = require(functionPath);
  console.log('✅ Netlify function import successful');
  
  console.log('🎉 All tests passed! The Netlify function should work.');
  
} catch (error) {
  console.error('❌ Module import failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
