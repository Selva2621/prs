const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

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

    // Dynamically import AppModule to handle potential import issues
    const { AppModule } = require('../../dist/src/app.module');

    const app = await NestFactory.create(AppModule, {
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
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
    throw error;
  }
}

exports.handler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    console.log(`Handling ${event.httpMethod} request to ${event.path}`);

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
