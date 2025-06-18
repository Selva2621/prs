const fs = require('fs');
const path = require('path');

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

// Copy essential files to functions directory for better compatibility
const functionsPackageJsonPath = path.join(__dirname, '..', 'netlify', 'functions', 'package.json');
if (fs.existsSync(functionsPackageJsonPath)) {
  console.log('✅ Functions package.json already exists');
} else {
  console.log('⚠️  Functions package.json not found - dependencies might not be available');
}

console.log('🎉 Netlify build preparation completed!');
