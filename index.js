// Serverless function wrapper for NestJS on Vercel
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;

async function createNestApp() {
  if (!app) {
    try {
      // Import the compiled AppModule
      const { AppModule } = require('./dist/app.module');

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

// Serverless function handler
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
