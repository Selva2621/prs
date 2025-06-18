// Set up environment for serverless execution
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Store original require for safe access
const originalRequire = require;
const path = require('path');

// Enhanced safe require function with better module resolution for serverless
function safeRequire(id) {
  try {
    // First try normal require
    return originalRequire(id);
  } catch (error) {
    // Handle optional dependencies that might not be available
    if (id === '@nestjs/microservices' ||
      id === 'class-transformer/storage' ||
      id === '@nestjs/microservices/microservices-module') {
      console.warn(`Optional dependency ${id} not available, skipping...`);
      return null;
    }

    // For @nestjs modules, try alternative resolution paths
    if (id.startsWith('@nestjs/')) {
      const alternativePaths = [
        path.resolve(__dirname, 'node_modules', id),
        path.resolve(__dirname, '..', '..', 'node_modules', id),
        path.resolve(process.cwd(), 'node_modules', id),
        path.resolve(process.cwd(), 'netlify', 'functions', 'node_modules', id)
      ];

      for (const altPath of alternativePaths) {
        try {
          console.log(`Trying alternative path for ${id}: ${altPath}`);
          return originalRequire(altPath);
        } catch (altError) {
          console.log(`Alternative path failed: ${altPath} - ${altError.message}`);
          continue;
        }
      }
    }

    console.error(`Failed to require module '${id}':`, error.message);
    console.error('Current working directory:', process.cwd());
    console.error('__dirname:', __dirname);

    // Try to provide more debugging information
    try {
      const fs = originalRequire('fs');
      const nodeModulesPath = path.resolve(__dirname, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.error('Available packages in node_modules:', fs.readdirSync(nodeModulesPath).slice(0, 10));

        const nestjsPath = path.resolve(nodeModulesPath, '@nestjs');
        if (fs.existsSync(nestjsPath)) {
          console.error('Available @nestjs packages:', fs.readdirSync(nestjsPath));
        }
      }
    } catch (debugError) {
      console.error('Could not provide debug information:', debugError.message);
    }

    throw error;
  }
}

let cachedApp;

// Environment validation
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Create Netlify handler using serverless-http
function createNetlifyHandler(expressApp) {
  try {
    // Try to use serverless-http for better compatibility
    const serverless = safeRequire('serverless-http');
    if (serverless) {
      console.log('Using serverless-http for request handling');
      return serverless(expressApp, {
        binary: false,
        request: (request, event, context) => {
          // Add any custom request processing here if needed
          return request;
        },
        response: (response, event, context) => {
          // Add any custom response processing here if needed
          return response;
        }
      });
    }
  } catch (error) {
    console.warn('serverless-http not available, falling back to manual handler:', error.message);
  }

  // Fallback to manual handler if serverless-http is not available
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

    // Load NestJS modules inside the function to avoid early module resolution
    console.log('Loading NestJS modules...');
    console.log('Module resolution paths:', module.paths);

    let NestFactory, ValidationPipe, DocumentBuilder, SwaggerModule;

    try {
      console.log('Loading @nestjs/core...');
      const nestCore = safeRequire('@nestjs/core');
      NestFactory = nestCore.NestFactory;
      console.log('✅ @nestjs/core loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load @nestjs/core:', error.message);
      throw new Error(`Critical dependency @nestjs/core could not be loaded: ${error.message}`);
    }

    try {
      console.log('Loading @nestjs/common...');
      const nestCommon = safeRequire('@nestjs/common');
      ValidationPipe = nestCommon.ValidationPipe;
      console.log('✅ @nestjs/common loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load @nestjs/common:', error.message);
      throw new Error(`Critical dependency @nestjs/common could not be loaded: ${error.message}`);
    }

    try {
      console.log('Loading @nestjs/swagger...');
      const nestSwagger = safeRequire('@nestjs/swagger');
      DocumentBuilder = nestSwagger.DocumentBuilder;
      SwaggerModule = nestSwagger.SwaggerModule;
      console.log('✅ @nestjs/swagger loaded successfully');
    } catch (error) {
      console.warn('⚠️ @nestjs/swagger could not be loaded, Swagger will be disabled:', error.message);
      DocumentBuilder = null;
      SwaggerModule = null;
    }

    // Dynamically import AppModule to handle potential import issues
    let AppModule;
    const appModulePaths = [
      '../../dist/src/app.module',
      '../../dist/src/app.module.js',
      path.resolve(__dirname, '../../dist/src/app.module'),
      path.resolve(__dirname, '../../dist/src/app.module.js')
    ];

    let appModuleLoaded = false;
    for (const modulePath of appModulePaths) {
      try {
        console.log(`Trying to load AppModule from: ${modulePath}`);
        const appModuleExports = safeRequire(modulePath);
        AppModule = appModuleExports.AppModule;
        console.log('✅ AppModule loaded successfully from:', modulePath);
        appModuleLoaded = true;
        break;
      } catch (error) {
        console.log(`❌ Failed to load AppModule from ${modulePath}:`, error.message);
        continue;
      }
    }

    if (!appModuleLoaded) {
      throw new Error('Could not load AppModule from any of the attempted paths');
    }

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
    if (process.env.NODE_ENV !== 'production' && DocumentBuilder && SwaggerModule) {
      try {
        const config = new DocumentBuilder()
          .setTitle('Cosmic Love API')
          .setDescription('A romantic application API with real-time features')
          .setVersion('1.0')
          .addBearerAuth()
          .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api', app, document);
        console.log('✅ Swagger documentation setup completed');
      } catch (swaggerError) {
        console.warn('⚠️ Failed to setup Swagger documentation:', swaggerError.message);
        // Continue without Swagger in case of issues
      }
    } else {
      console.log('ℹ️ Swagger disabled (production mode or modules not available)');
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

        // Check multiple potential paths
        const paths = [
          path.resolve(__dirname, '../../dist/src'),
          path.resolve(__dirname, './node_modules'),
          path.resolve(__dirname, '../node_modules'),
          path.resolve(__dirname, '../../node_modules')
        ];

        paths.forEach(checkPath => {
          if (fs.existsSync(checkPath)) {
            console.error(`Available in ${checkPath}:`, fs.readdirSync(checkPath).slice(0, 10).join(', '));
          } else {
            console.error(`Path not found: ${checkPath}`);
          }
        });

        // Check specifically for @nestjs/core
        const nestjsCorePath = path.resolve(__dirname, './node_modules/@nestjs/core');
        if (fs.existsSync(nestjsCorePath)) {
          console.error('@nestjs/core found at:', nestjsCorePath);
        } else {
          console.error('@nestjs/core not found at expected path:', nestjsCorePath);
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
