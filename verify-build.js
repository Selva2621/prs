// Verify that the build process creates all necessary files for Vercel deployment
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build for Vercel deployment...\n');

// Check if dist directory exists
if (!fs.existsSync('./dist')) {
  console.error('❌ dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Check for key compiled files
const requiredFiles = [
  './dist/app.module.js',
  './dist/main.js',
  './index.js',
  './vercel.json',
  './package.json'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is missing`);
    allFilesExist = false;
  }
});

// Check if AppModule can be loaded
try {
  console.log('\n🧪 Testing AppModule loading...');
  const appModuleExports = require('./dist/app.module');
  const AppModule = appModuleExports.AppModule;
  
  if (AppModule) {
    console.log('✅ AppModule can be loaded successfully');
    console.log(`   Type: ${typeof AppModule}`);
  } else {
    console.error('❌ AppModule is undefined in exports');
    console.log('   Available exports:', Object.keys(appModuleExports));
    allFilesExist = false;
  }
} catch (error) {
  console.error('❌ Failed to load AppModule:', error.message);
  allFilesExist = false;
}

// Check dist directory contents
console.log('\n📁 Contents of dist directory:');
try {
  const distFiles = fs.readdirSync('./dist', { withFileTypes: true });
  distFiles.forEach(file => {
    const type = file.isDirectory() ? '📁' : '📄';
    console.log(`   ${type} ${file.name}`);
  });
} catch (error) {
  console.error('❌ Cannot read dist directory:', error.message);
  allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ Build verification passed! Ready for Vercel deployment.');
  console.log('\n📋 Next steps:');
  console.log('   1. Set environment variables in Vercel dashboard');
  console.log('   2. Push changes to GitHub');
  console.log('   3. Deploy to Vercel');
} else {
  console.error('❌ Build verification failed! Fix the issues above before deploying.');
  process.exit(1);
}
