// Simple test to check if we can require serverless-http
console.log('Testing serverless-http import...');
console.log('Current working directory:', process.cwd());

try {
  const serverless = require('serverless-http');
  console.log('✅ serverless-http imported successfully');
  console.log('Type:', typeof serverless);
} catch (error) {
  console.error('❌ Failed to import serverless-http:', error.message);
  
  // Try different paths
  const path = require('path');
  const fs = require('fs');
  
  const possiblePaths = [
    './node_modules/serverless-http',
    '../node_modules/serverless-http',
    '../../node_modules/serverless-http'
  ];
  
  for (const testPath of possiblePaths) {
    const fullPath = path.resolve(testPath);
    console.log(`Checking path: ${fullPath}`);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Path exists: ${fullPath}`);
      try {
        const serverless = require(fullPath);
        console.log('✅ Successfully imported from:', fullPath);
        break;
      } catch (err) {
        console.log(`❌ Failed to import from ${fullPath}:`, err.message);
      }
    } else {
      console.log(`❌ Path does not exist: ${fullPath}`);
    }
  }
}
