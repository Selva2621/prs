# Vercel Deployment Guide

This guide explains how to deploy the Cosmic Love API to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Environment Variables**: You'll need to set up your database and other environment variables

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it as a Node.js project

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
   - Deploy the serverless function

## Project Structure

```
├── api/
│   └── index.js          # Serverless function entry point
├── dist/                 # Compiled TypeScript (generated)
├── public/
│   └── index.html        # Landing page
├── src/                  # Source code
├── vercel.json           # Vercel configuration
└── package.json
```

## Configuration Files

### vercel.json
Configures Vercel to:
- Build the serverless function from `api/index.js`
- Serve static files from `public/`
- Route all API requests to the serverless function

### api/index.js
- Serverless function that initializes NestJS
- Handles all API requests
- Includes CORS configuration
- Sets up Swagger documentation

## Important Notes

### WebSockets
- WebSockets don't work in Vercel's serverless environment
- The WebSocket module is included but won't function in production
- Consider using Vercel's Edge Functions or a separate WebSocket service

### File Uploads
- File uploads to local filesystem won't persist in serverless
- Consider using cloud storage (AWS S3, Cloudinary, etc.)
- Current upload endpoints may not work as expected

### Database
- Uses Supabase PostgreSQL with connection pooling
- Prisma is configured for serverless environments
- Connection pooling is essential for serverless functions

## Troubleshooting

### "NOT_FOUND" Error
- Check that environment variables are set correctly
- Verify database connection
- Check Vercel function logs

### Build Failures
- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors
- Verify Prisma schema is valid

### Performance
- First request may be slow (cold start)
- Subsequent requests should be faster
- Consider using Vercel Pro for better performance

## Testing

After deployment, test these endpoints:
- `GET /` - Landing page
- `GET /health` - Health check
- `GET /api` - Swagger documentation
- `POST /auth/login` - Authentication

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test locally first with `npm run build && npm start`
