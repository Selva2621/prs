const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../../dist/src/app.module');
const { ValidationPipe } = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const serverless = require('serverless-http');

let cachedApp;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(AppModule);

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
  
  const expressApp = app.getHttpAdapter().getInstance();
  cachedApp = serverless(expressApp);
  
  return cachedApp;
}

exports.handler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    const app = await createApp();
    return await app(event, context);
  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
