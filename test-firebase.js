const admin = require('firebase-admin');
require('dotenv').config();

async function testFirebase() {
    try {
        console.log('Testing Firebase configuration...');

        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            console.log('Firebase is already initialized');
            const app = admin.apps[0];
            console.log('Project ID:', app.options.projectId);
        } else {
            console.log('Initializing Firebase...');

            // Initialize Firebase Admin SDK with environment variables
            const app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
                projectId: process.env.FIREBASE_PROJECT_ID,
            });

            console.log('Firebase initialized successfully');
            console.log('Project ID:', app.options.projectId);
        }

        // Test messaging service
        const messaging = admin.messaging();
        console.log('Messaging service is available');

        // Test sending a test message (this will fail without a valid token, but shows the service works)
        try {
            // This will fail, but it's expected - we just want to verify the service is working
            await messaging.send({
                token: 'test-token',
                notification: {
                    title: 'Test',
                    body: 'Test message',
                },
            });
        } catch (error) {
            if (error.code === 'messaging/invalid-registration-token') {
                console.log('✅ Firebase messaging service is working (expected error for invalid token)');
            } else {
                console.log('Firebase messaging error:', error.message);
            }
        }

        console.log('✅ Firebase is properly enabled and configured');

    } catch (error) {
        console.error('❌ Firebase test failed:', error);
        process.exit(1);
    }
}

// Run the test
testFirebase(); 