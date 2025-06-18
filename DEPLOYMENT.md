# Deployment Guide

This guide covers deploying your NestJS backend application to Netlify and other platforms.

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Netlify Deployment](#netlify-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## 🌍 Environment Setup

### Environment Files

The project includes several environment files for different deployment scenarios:

- `.env` - Development environment (local)
- `.env.production` - Production environment
- `.env.staging` - Staging environment
- `.env.local` - Local development overrides
- `.env.example` - Template with all available variables

### Creating Environment Files

1. Copy `.env.example` to create your environment file:
   ```bash
   cp .env.example .env.production
   ```

2. Fill in your actual values in the new file

3. **Never commit real credentials to version control**

## 🚀 Netlify Deployment

### Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Supabase Project**: Set up your database at [supabase.com](https://supabase.com)
3. **GitHub Repository**: Your code should be in a Git repository

### Deployment Steps

1. **Connect Repository**
   - Go to Netlify dashboard
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (leave empty)

3. **Set Environment Variables**
   Go to Site settings > Environment variables and add:
   ```
   NODE_ENV=production
   DATABASE_URL=your_database_url
   DIRECT_URL=your_direct_database_url
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Deploy**
   - Click "Deploy site"
   - Monitor the build logs for any issues

### Custom Build Script

The project includes a custom deployment script at `scripts/deploy.js` that:
- Validates environment variables
- Generates Prisma client
- Runs database migrations (if enabled)
- Builds the application
- Verifies build output

To use it, set your build command to:
```bash
node scripts/deploy.js
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database connection | `postgresql://user:pass@host:6543/db?pgbouncer=true` |
| `DIRECT_URL` | Direct database connection for migrations | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secret-key` |
| `SUPABASE_URL` | Supabase project URL | `https://project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` |
| `SOCKET_PORT` | WebSocket port | `3001` |
| `RUN_MIGRATIONS` | Run migrations on deploy | `false` |

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and API keys

2. **Database Setup**
   - Use the SQL editor to run your schema
   - Or use Prisma migrations:
     ```bash
     npx prisma migrate deploy
     ```

3. **Connection Strings**
   - Use pooled connection for app: `postgresql://...?pgbouncer=true`
   - Use direct connection for migrations: `postgresql://...` (no pgbouncer)

### Running Migrations

For production deployments with migrations:

1. Set environment variable:
   ```
   RUN_MIGRATIONS=true
   ```

2. Migrations will run automatically during build

## 🔍 Monitoring and Health Checks

### Health Check Endpoint

The application includes a health check function at `/api/health` that provides:
- Application status
- Environment information
- Database connectivity
- Memory usage
- Uptime statistics

### Logs

Monitor your application logs in:
- Netlify: Site dashboard > Functions tab
- Application logs: Check the build and function logs

## 🐛 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify Prisma schema is valid
   - Ensure all dependencies are installed

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase project is active
   - Ensure IP restrictions allow Netlify

3. **Migration Failures**
   - Use DIRECT_URL for migrations
   - Check database permissions
   - Verify migration files are valid

### Debug Mode

Enable debug logging by setting:
```
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Build Logs

Check Netlify build logs for detailed error information:
1. Go to your site dashboard
2. Click on a deploy
3. View the build logs

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com/)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review build logs for specific errors
3. Verify all environment variables are set correctly
4. Test your database connection locally first

For additional support, check the project's issue tracker or documentation.
