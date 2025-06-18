import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

let cachedApp: any = null;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

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
  cachedApp = expressApp;
  return expressApp;
}

// For serverless (Vercel)
export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app(req, res);
}

// For regular server
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Cosmic Love API is running on: http://localhost:${port}`);
  console.log(`🌐 Server accessible on network at: http://192.168.86.8:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

// Only run bootstrap if not in serverless environment
if (require.main === module) {
  bootstrap();
}
