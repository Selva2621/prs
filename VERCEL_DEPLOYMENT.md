# Vercel Deployment Guide for NestJS Backend API

This guide explains how to deploy the Cosmic Love NestJS Backend API to Vercel.

## Important Note

This is a **NestJS Backend API Application** - not a web app. It provides REST API endpoints for mobile/frontend applications.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Environment Variables**: Database and authentication configuration required

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will detect it as a Node.js backend application

### 2. Configure Environment Variables

In your Vercel project dashboard, go to Settings → Environment Variables and add:

```
DATABASE_URL=your_supabase_database_url_with_pgbouncer
DIRECT_URL=your_supabase_direct_database_url
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=production
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
```

### 3. Deploy

1. Click "Deploy" in Vercel
2. Vercel will automatically:
   - Install dependencies
   - Generate Prisma client
   - Build the TypeScript code
   - Start the NestJS backend server

## Project Structure

```
├── src/
│   ├── main.ts           # NestJS application entry point
│   ├── app.module.ts     # Main application module
│   └── modules/          # Feature modules (auth, users, messages, etc.)
├── dist/                 # Compiled TypeScript output
├── prisma/               # Database schema and migrations
├── vercel.json           # Vercel deployment configuration
└── package.json          # Dependencies and scripts
```

## Configuration Files

### vercel.json
Configures Vercel to:
- Deploy as a Node.js backend application
- Use standard package.json build process
- Route all requests to the NestJS application

### src/main.ts
- Standard NestJS bootstrap function
- Configures CORS for mobile app access
- Sets up Swagger API documentation
- Includes validation pipes and security

## API Endpoints

After deployment, your NestJS backend will provide these API endpoints:

### Core Endpoints
- `GET /health` - Health check and system status
- `GET /debug` - Environment and configuration info
- `GET /api` - Swagger API documentation

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile

### Users
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `GET /users/:id/stats` - User statistics

### Messages
- `POST /messages` - Send message
- `GET /messages` - Get messages
- `GET /messages/conversations` - Get conversations

### Photos
- `POST /photos` - Upload photo
- `GET /photos` - Get photos
- `POST /photos/:id/share` - Share photo

### Video Calls
- `POST /video-calls` - Initiate video call
- `GET /video-calls/active` - Get active calls

### Proposals
- `POST /proposals` - Create proposal
- `GET /proposals/sent` - Get sent proposals
- `GET /proposals/received` - Get received proposals

## Important Notes

### WebSockets
- WebSocket functionality is included for real-time features
- May have limitations in Vercel's environment
- Consider alternative real-time solutions if needed

### File Uploads
- File uploads are configured for local storage
- For production, consider cloud storage (AWS S3, Cloudinary)
- Current upload endpoints work but files may not persist

### Database
- Uses Supabase PostgreSQL with Prisma ORM
- Connection pooling configured for production
- All database operations are async and optimized

## Troubleshooting

### Deployment Issues
- Verify all environment variables are set
- Check build logs in Vercel dashboard
- Ensure database connection is working

### API Not Responding
- Check Vercel function logs
- Verify environment variables
- Test database connectivity

### CORS Issues
- CORS is configured for mobile app origins
- Add your frontend domain to CORS origins if needed

## Testing Your Deployment

1. **Health Check**: `GET https://your-app.vercel.app/health`
2. **API Documentation**: `GET https://your-app.vercel.app/api`
3. **Authentication**: `POST https://your-app.vercel.app/auth/login`

## Local Development

To run locally:
```bash
npm install
npm run build
npm start
```

The API will be available at `http://localhost:3000`
