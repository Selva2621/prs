const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

let app;
let isAppInitialized = false;

async function createNestApp() {
  if (!isAppInitialized) {
    try {
      console.log('Initializing NestJS application...');
      
      // Try to load the compiled AppModule first, fallback to source
      let AppModule;
      try {
        console.log('Attempting to load compiled AppModule...');
        AppModule = require('./dist/app.module').AppModule;
        console.log('✅ Loaded compiled AppModule');
      } catch (distError) {
        console.log('❌ Failed to load compiled AppModule:', distError.message);
        console.log('🔄 Attempting to load source AppModule...');
        try {
          // If dist doesn't exist, we need to compile on the fly or use source
          const { exec } = require('child_process');
          const { promisify } = require('util');
          const execAsync = promisify(exec);
          
          // Try to build if dist doesn't exist
          console.log('Building TypeScript...');
          await execAsync('npx tsc -p tsconfig.build.json');
          console.log('✅ TypeScript build completed');
          
          AppModule = require('./dist/app.module').AppModule;
          console.log('✅ Loaded AppModule after build');
        } catch (buildError) {
          console.error('❌ Failed to build or load AppModule:', buildError.message);
          throw new Error('Cannot initialize application: ' + buildError.message);
        }
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
