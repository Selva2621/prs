import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class FirebaseConfig implements OnModuleInit {
    private app: admin.app.App;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            // Check if Firebase is already initialized
            if (admin.apps.length > 0) {
                const existingApp = admin.apps[0];
                if (existingApp) {
                    this.app = existingApp;
                    return;
                }
            }

            // Initialize Firebase Admin SDK with environment variables
            this.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
                projectId: process.env.FIREBASE_PROJECT_ID,
            });

            console.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Firebase Admin SDK:', error);
            throw error;
        }
    }

    getMessaging(): admin.messaging.Messaging {
        if (!this.app) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        return this.app.messaging();
    }

    getApp(): admin.app.App {
        if (!this.app) {
            throw new Error('Firebase Admin SDK not initialized');
        }
        return this.app;
    }
} 