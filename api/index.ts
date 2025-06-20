import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// For Vercel serverless deployment
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
    cachedApp = app;
    return app;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
    try {
        const app = await createApp();
        const expressInstance = app.getHttpAdapter().getInstance();

        // Handle the request
        return new Promise((resolve, reject) => {
            expressInstance(req, res, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    } catch (error) {
        console.error('Error in Vercel handler:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
} 