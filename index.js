const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;
let isAppInitialized = false;

async function createNestApp() {
  if (!isAppInitialized) {
    try {
      console.log('Initializing NestJS application...');

      // Load the compiled AppModule - it should exist after build
      let AppModule;
      try {
        console.log('Attempting to load compiled AppModule from ./dist/app.module...');
        const appModuleExports = require('./dist/app.module');
        AppModule = appModuleExports.AppModule;

        if (!AppModule) {
          console.log('AppModule not found in exports, trying default export...');
          AppModule = appModuleExports.default || appModuleExports;
        }

        if (!AppModule) {
          throw new Error('AppModule is undefined in the exports');
        }

        console.log('✅ Loaded compiled AppModule successfully');
      } catch (distError) {
        console.error('❌ Failed to load compiled AppModule:', distError.message);
        console.error('Available files in current directory:', require('fs').readdirSync('.'));

        try {
          console.log('Checking if dist directory exists...');
          const distFiles = require('fs').readdirSync('./dist');
          console.log('Files in dist directory:', distFiles);
        } catch (dirError) {
          console.error('❌ Dist directory does not exist:', dirError.message);
        }

        throw new Error('Cannot find compiled AppModule. Build may have failed. Error: ' + distError.message);
      }

      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
        cors: true
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
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
      isAppInitialized = true;
      console.log('✅ NestJS app initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NestJS app:', error);
      console.error('Error details:', error.stack);
      throw error;
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    console.log(`🌐 Handling ${req.method} ${req.url}`);

    const nestApp = await createNestApp();
    const expressApp = nestApp.getHttpAdapter().getInstance();

    // Ensure response object has required properties for Express
    if (!res.getHeader) {
      res.getHeader = function (name) {
        return this.headers && this.headers[name.toLowerCase()];
      };
    }

    if (!res.setHeader) {
      res.setHeader = function (name, value) {
        if (!this.headers) this.headers = {};
        this.headers[name.toLowerCase()] = value;
        return this;
      };
    }

    if (!res.removeHeader) {
      res.removeHeader = function (name) {
        if (this.headers) {
          delete this.headers[name.toLowerCase()];
        }
        return this;
      };
    }

    // Handle the request with Express
    expressApp(req, res);

  } catch (error) {
    console.error('❌ Error in serverless function:', error);

    // Ensure we can send an error response
    if (!res.headersSent) {
      try {
        res.status(500).json({
          error: 'Internal Server Error',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      } catch (responseError) {
        console.error('❌ Failed to send error response:', responseError);
        res.end('Internal Server Error');
      }
    }
  }
};
