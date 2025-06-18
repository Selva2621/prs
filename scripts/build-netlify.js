const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building for Netlify deployment...');

// Create netlify functions directory if it doesn't exist
const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
  console.log('✅ Created netlify/functions directory');
}

// Copy package.json to dist for dependencies
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const distPackageJsonPath = path.join(__dirname, '..', 'dist', 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Create a minimal package.json for production
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    dependencies: packageJson.dependencies,
    engines: {
      node: ">=18.0.0"
    }
  };

  fs.writeFileSync(distPackageJsonPath, JSON.stringify(prodPackageJson, null, 2));
  console.log('✅ Created production package.json in dist/');
}

// Copy Prisma schema to dist
const prismaSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const distPrismaDir = path.join(__dirname, '..', 'dist', 'prisma');
const distPrismaSchemaPath = path.join(distPrismaDir, 'schema.prisma');

if (fs.existsSync(prismaSchemaPath)) {
  if (!fs.existsSync(distPrismaDir)) {
    fs.mkdirSync(distPrismaDir, { recursive: true });
  }
  fs.copyFileSync(prismaSchemaPath, distPrismaSchemaPath);
  console.log('✅ Copied Prisma schema to dist/');
}

// Create a simple index.html for the root
const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');
const indexHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Cosmic Love API</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .api-link { color: #0066cc; text-decoration: none; }
        .api-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Cosmic Love API</h1>
        <p>Welcome to the Cosmic Love Backend API</p>
        <p>
            <a href="/api" class="api-link">📚 API Documentation</a>
        </p>
        <p>
            <small>Powered by NestJS & Netlify Functions</small>
        </p>
    </div>
</body>
</html>
`;

fs.writeFileSync(indexHtmlPath, indexHtmlContent.trim());
console.log('✅ Created index.html');

// Install dependencies in functions directory for Netlify Functions
const functionsPackageJsonPath = path.join(__dirname, '..', 'netlify', 'functions', 'package.json');
if (fs.existsSync(functionsPackageJsonPath)) {
  console.log('✅ Functions package.json found, installing dependencies...');

  try {
    console.log('📦 Installing function dependencies...');

    // First, clean any existing node_modules to avoid conflicts
    const functionsNodeModules = path.join(functionsDir, 'node_modules');
    if (fs.existsSync(functionsNodeModules)) {
      console.log('🧹 Cleaning existing node_modules...');
      fs.rmSync(functionsNodeModules, { recursive: true, force: true });
    }

    // Install with specific flags for serverless environment
    execSync('npm install --production --no-optional --no-audit --no-fund', {
      stdio: 'inherit',
      cwd: functionsDir,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log('✅ Function dependencies installed successfully');

    // Verify critical NestJS dependencies
    const criticalDeps = ['@nestjs/core', '@nestjs/common', '@nestjs/platform-express'];
    const missingDeps = criticalDeps.filter(dep => {
      const depPath = path.join(functionsNodeModules, dep);
      return !fs.existsSync(depPath);
    });

    if (missingDeps.length === 0) {
      console.log('✅ All critical NestJS dependencies verified');
    } else {
      console.error('❌ Missing critical dependencies:', missingDeps.join(', '));
      throw new Error(`Critical dependencies missing: ${missingDeps.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Failed to install function dependencies:', error.message);
    console.log('⚠️  Attempting fallback dependency installation...');

    // Fallback: try copying from main node_modules
    try {
      const mainNodeModules = path.join(__dirname, '..', 'node_modules');
      const functionsNodeModules = path.join(functionsDir, 'node_modules');

      if (fs.existsSync(mainNodeModules)) {
        console.log('📋 Copying critical dependencies from main node_modules...');

        if (!fs.existsSync(functionsNodeModules)) {
          fs.mkdirSync(functionsNodeModules, { recursive: true });
        }

        const criticalDeps = ['@nestjs', '@prisma', 'reflect-metadata', 'rxjs'];
        criticalDeps.forEach(dep => {
          const srcPath = path.join(mainNodeModules, dep);
          const destPath = path.join(functionsNodeModules, dep);

          if (fs.existsSync(srcPath)) {
            console.log(`📋 Copying ${dep}...`);
            fs.cpSync(srcPath, destPath, { recursive: true });
          }
        });

        console.log('✅ Fallback dependency copy completed');
      }
    } catch (fallbackError) {
      console.error('❌ Fallback dependency installation also failed:', fallbackError.message);
      throw error; // Re-throw original error
    }
  }
} else {
  console.log('⚠️  Functions package.json not found - dependencies might not be available');
}

// Final verification of the build
const nodeModulesPath = path.join(functionsDir, 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  console.log('🔍 Final verification of dependencies...');

  // Check for @nestjs/core specifically
  const nestjsCorePath = path.join(nodeModulesPath, '@nestjs', 'core');
  if (fs.existsSync(nestjsCorePath)) {
    console.log('✅ @nestjs/core is available');

    // Check if the main entry point exists
    const corePackageJson = path.join(nestjsCorePath, 'package.json');
    if (fs.existsSync(corePackageJson)) {
      const corePackage = JSON.parse(fs.readFileSync(corePackageJson, 'utf8'));
      console.log(`✅ @nestjs/core version: ${corePackage.version}`);
    }
  } else {
    console.error('❌ @nestjs/core is still missing after installation');
  }

  // List available @nestjs packages
  const nestjsPath = path.join(nodeModulesPath, '@nestjs');
  if (fs.existsSync(nestjsPath)) {
    const nestjsPackages = fs.readdirSync(nestjsPath);
    console.log('📦 Available @nestjs packages:', nestjsPackages.join(', '));
  }

} else {
  console.error('❌ No node_modules found in functions directory after installation');
}

console.log('🎉 Netlify build preparation completed!');
