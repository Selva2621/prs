import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile app
  app.enableCors({
    origin: [
      'http://localhost:19006',
      'exp://192.168.1.100:19000',
      'exp://192.168.86.8:8081',
      'http://192.168.86.8:8081',
      'https://prs-c7e1.onrender.com',
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
  console.log(`🚀 Cosmic Love API is running on port: ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();
