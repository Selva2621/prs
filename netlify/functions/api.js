// Set up environment for serverless execution
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Polyfill for optional dependencies that might not be bundled
const originalRequire = require;
require = function (id) {
  try {
    return originalRequire(id);
  } catch (error) {
    // Handle optional dependencies that might not be available
    if (id === '@nestjs/microservices' ||
      id === 'class-transformer/storage' ||
      id === '@nestjs/microservices/microservices-module') {
      console.warn(`Optional dependency ${id} not available, skipping...`);
      return null;
    }
    throw error;
  }
};

const { NestFactory } = originalRequire('@nestjs/core');
const { ValidationPipe } = originalRequire('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = originalRequire('@nestjs/swagger');

let cachedApp;

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Convert Express request/response to Netlify format
function createNetlifyHandler(expressApp) {
  return async (event, context) => {
    return new Promise((resolve, reject) => {
      const { httpMethod, path, headers, body, queryStringParameters } = event;

      // Create a mock request object
      const req = {
        method: httpMethod,
        url: path + (queryStringParameters ? '?' + new URLSearchParams(queryStringParameters).toString() : ''),
        headers: headers || {},
        body: body || '',
        query: queryStringParameters || {},
        params: {},
        get: function (name) { return this.headers[name.toLowerCase()]; }
      };

      // Create a mock response object
      const res = {
        statusCode: 200,
        headers: {},
        body: '',
        status: function (code) { this.statusCode = code; return this; },
        set: function (name, value) { this.headers[name] = value; return this; },
        send: function (data) {
          this.body = typeof data === 'string' ? data : JSON.stringify(data);
          resolve({
            statusCode: this.statusCode,
            headers: this.headers,
            body: this.body
          });
        },
        json: function (data) {
          this.headers['Content-Type'] = 'application/json';
          this.body = JSON.stringify(data);
          resolve({
            statusCode: this.statusCode,
            headers: this.headers,
            body: this.body
          });
        },
        end: function (data) {
          if (data) this.body = data;
          resolve({
            statusCode: this.statusCode,
            headers: this.headers,
            body: this.body
          });
        }
      };

      try {
        // Handle the request with Express app
        expressApp(req, res);
      } catch (error) {
        reject(error);
      }
    });
  };
}

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  try {
    // Validate environment variables first
    validateEnvironment();

    console.log('Creating NestJS application...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Available environment variables:', Object.keys(process.env).filter(key =>
      key.includes('DATABASE') || key.includes('JWT') || key.includes('SUPABASE')
    ));

    // Dynamically import AppModule to handle potential import issues
    const { AppModule } = originalRequire('../../dist/src/app.module');
    console.log('AppModule loaded successfully');

    const app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
      abortOnError: false, // Don't abort on non-critical errors
    });

    // Enable CORS for mobile app and web
    app.enableCors({
      origin: [
        'http://localhost:19006',
        'exp://192.168.1.100:19000',
        'exp://192.168.86.8:8081',
        'http://192.168.86.8:8081',
        process.env.FRONTEND_URL || '*', // Allow frontend URL from env
        '*' // Allow all origins for development
      ],
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }));

    // Only setup Swagger in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Cosmic Love API')
        .setDescription('A romantic application API with real-time features')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }

    console.log('Initializing NestJS application...');
    await app.init();

    console.log('Creating Netlify handler...');
    const expressApp = app.getHttpAdapter().getInstance();
    cachedApp = createNetlifyHandler(expressApp);

    console.log('NestJS application ready for serverless deployment');
    return cachedApp;

  } catch (error) {
    console.error('Failed to create NestJS application:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Check if it's a module resolution error
    if (error.message && error.message.includes('Cannot find module')) {
      console.error('Module resolution error detected. This might be a bundling issue.');
      try {
        const fs = originalRequire('fs');
        const path = originalRequire('path');
        const distPath = path.resolve(__dirname, '../../dist/src');
        if (fs.existsSync(distPath)) {
          console.error('Available files in dist/src:', fs.readdirSync(distPath).join(', '));
        } else {
          console.error('dist/src directory not found at:', distPath);
        }
      } catch (fsError) {
        console.error('Could not check filesystem:', fsError.message);
      }
    }

    throw error;
  }
}

exports.handler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log(`Handling ${event.httpMethod} request to ${event.path}`);
    console.log('Event headers:', JSON.stringify(event.headers, null, 2));
    console.log('Context:', JSON.stringify({
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      memoryLimitInMB: context.memoryLimitInMB,
      remainingTimeInMillis: context.getRemainingTimeInMillis ? context.getRemainingTimeInMillis() : 'unknown'
    }, null, 2));

    const app = await createApp();
    const result = await app(event, context);

    console.log(`Request completed with status: ${result.statusCode}`);
    return result;

  } catch (error) {
    console.error('Error in Netlify function:', error);
    console.error('Error stack:', error.stack);

    // Return more detailed error information for debugging
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        ...(process.env.NODE_ENV !== 'production' && {
          stack: error.stack,
          details: {
            event: {
              httpMethod: event.httpMethod,
              path: event.path,
              headers: event.headers,
            }
          }
        })
      })
    };
  }
};
