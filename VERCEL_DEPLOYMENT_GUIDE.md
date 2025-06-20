# Vercel Deployment Guide for Cosmic Love API

This guide will help you deploy your NestJS Cosmic Love API to Vercel with the correct configuration.

## 🚀 Quick Start

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Ensure your PostgreSQL database is accessible from the internet (e.g., Supabase, Railway, PlanetScale)
3. **Environment Variables**: Have your database credentials and API keys ready

### Option 1: Deploy via GitHub (Recommended)

1. **Push to GitHub**: Ensure your code is pushed to a GitHub repository
2. **Connect to Vercel**: 
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
3. **Configure Environment Variables** (see section below)
4. **Deploy**: Vercel will automatically build and deploy your application

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts** and configure environment variables when asked

## 🔧 Environment Variables Configuration

In your Vercel dashboard, add these environment variables:

### Required Variables

```
DATABASE_URL=postgresql://username:password@host:port/database?pgbouncer=true
DIRECT_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Optional Variables

```
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
SOCKET_PORT=3001
```

## 📁 Project Structure for Vercel

The project has been configured with:

- **`vercel.json`**: Updated Vercel configuration with proper builds and routes
- **`api/index.ts`**: Vercel serverless function handler
- **`src/main.ts`**: Modified to support serverless deployment
- **`.vercelignore`**: Updated to include necessary source files
- **Build scripts**: Automatic Prisma client generation

## 🔍 Verification

After deployment, verify your API is working:

1. **Using the verification script**:
   ```bash
   npm run verify:deployment https://your-app.vercel.app
   ```

2. **Manual verification**:
   - Visit `https://your-app.vercel.app` (should return "Hello World!")
   - Visit `https://your-app.vercel.app/health` (should return health status)
   - Visit `https://your-app.vercel.app/api` (should show Swagger documentation)

## ⚠️ Important Considerations

### WebSocket Limitations
- Vercel serverless functions have limitations with WebSocket connections
- Real-time features may need adjustment or alternative implementation
- Consider using Vercel's Edge Functions or external WebSocket services

### File Uploads
- Local file uploads may not persist in serverless environments
- Consider using cloud storage (AWS S3, Cloudinary, etc.) for file uploads

### Database Migrations
- Run database migrations manually before deployment:
  ```bash
  npx prisma migrate deploy
  ```

### Cold Starts
- First request after inactivity may be slower due to serverless cold starts
- The application caches the NestJS instance to minimize this impact

## 🛠️ Troubleshooting

### Build Failures
- Check that all dependencies are in `dependencies` (not `devDependencies`)
- Ensure environment variables are set correctly
- Verify Prisma schema is valid
- Make sure TypeScript compilation is successful

### Runtime Errors
- Check Vercel function logs in the dashboard
- Verify database connectivity
- Ensure all required environment variables are set
- Check if Prisma client is generated correctly

### "Page Not Found" Errors
- Ensure the `api/index.ts` file exists and is properly configured
- Check that `vercel.json` has the correct routing configuration
- Verify that the build process completes successfully
- Check Vercel function logs for any compilation errors

### Performance Issues
- Monitor function execution time (Vercel has timeout limits)
- Consider optimizing database queries
- Use connection pooling for database connections

## 🔧 Build Configuration

The project uses the following build configuration:

```json
{
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api"
    }
  ]
}
```

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deploying-to-vercel)

## 🎉 Success!

Once deployed, your Cosmic Love API will be available at:
- **API Endpoint**: `https://your-app.vercel.app`
- **Health Check**: `https://your-app.vercel.app/health`
- **Documentation**: `https://your-app.vercel.app/api`

Your NestJS backend is now running serverlessly on Vercel! 🚀
