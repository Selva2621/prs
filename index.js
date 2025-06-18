// Serverless function wrapper for NestJS on Vercel
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;

async function createNestApp() {
  if (!app) {
    try {
      console.log('🔍 Checking for compiled files...');

      // Check if dist directory exists
      const fs = require('fs');
      const path = require('path');

      const distPath = path.join(__dirname, 'dist');
      const appModulePath = path.join(__dirname, 'dist', 'app.module.js');

      console.log('Current directory:', __dirname);
      console.log('Looking for dist at:', distPath);
      console.log('Looking for app.module at:', appModulePath);

      if (!fs.existsSync(distPath)) {
        throw new Error(`Dist directory not found at ${distPath}`);
      }

      if (!fs.existsSync(appModulePath)) {
        console.log('Files in dist directory:', fs.readdirSync(distPath));
        throw new Error(`app.module.js not found at ${appModulePath}`);
      }

      console.log('✅ Found compiled files, loading AppModule...');

      // Import the compiled AppModule
      const { AppModule } = require('./dist/app.module');

      if (!AppModule) {
        throw new Error('AppModule is undefined after import');
      }

      console.log('✅ AppModule loaded, creating NestJS app...');

      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log']
      });

      // Enable CORS for mobile app
      app.enableCors({
        origin: [
          'http://localhost:19006',
          'exp://192.168.1.100:19000',
          'exp://192.168.86.8:8081',
          'http://192.168.86.8:8081',
          '*' // Allow all origins for development
        ],
        credentials: true,
      });

      // Global validation pipe
      app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

      // Swagger documentation
      const config = new DocumentBuilder()
        .setTitle('Cosmic Love API')
        .setDescription('A romantic application API with real-time features')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);

      await app.init();
      console.log('✅ NestJS app initialized for serverless');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS app:', error);
      throw error;
    }
  }
  return app;
}

// Export for serverless (Vercel)
module.exports = async (req, res) => {
  try {
    const nestApp = await createNestApp();
    const expressApp = nestApp.getHttpAdapter().getInstance();

    // Handle the request
    return expressApp(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// For regular Node.js execution (when run directly)
if (require.main === module) {
  async function startServer() {
    try {
      const nestApp = await createNestApp();
      const port = process.env.PORT || 3000;

      // Start the server
      await nestApp.listen(port, '0.0.0.0');
      console.log(`🚀 Cosmic Love API is running on: http://localhost:${port}`);
      console.log(`📚 API Documentation: http://localhost:${port}/api`);
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
}
