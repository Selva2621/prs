# Environment Variables Setup for Netlify

This guide will help you set up all the required environment variables for your NestJS application on Netlify.

## 🔐 Required Environment Variables

### **Database Configuration**
```
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@YOUR_HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@YOUR_HOST:5432/postgres
```

### **Supabase Configuration**
```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **JWT Configuration**
```
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
```

### **Application Configuration**
```
NODE_ENV=production
PORT=3000
SOCKET_PORT=3001
MAX_FILE_SIZE=10485760
UPLOAD_DEST=./uploads
```

## 🚀 Setup Methods

### **Method 1: Netlify Dashboard (Recommended)**

1. **Go to your Netlify site**:
   - Visit [netlify.com](https://netlify.com)
   - Navigate to your site dashboard

2. **Access Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Click **Add a variable**

3. **Add each variable**:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Your actual value
   - **Scopes**: Select "All deploy contexts" or specific ones

4. **Save and Deploy**:
   - Click **Save**
   - Trigger a new deploy to apply changes

### **Method 2: Netlify CLI**

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Navigate to your project**:
   ```bash
   cd your-project-directory
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set NODE_ENV "production"
   netlify env:set DATABASE_URL "your_database_url"
   netlify env:set DIRECT_URL "your_direct_url"
   netlify env:set JWT_SECRET "your_jwt_secret"
   netlify env:set SUPABASE_URL "your_supabase_url"
   netlify env:set SUPABASE_ANON_KEY "your_anon_key"
   netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_service_role_key"
   netlify env:set JWT_EXPIRES_IN "7d"
   netlify env:set PORT "3000"
   netlify env:set SOCKET_PORT "3001"
   netlify env:set MAX_FILE_SIZE "10485760"
   netlify env:set UPLOAD_DEST "./uploads"
   ```

5. **Verify variables**:
   ```bash
   netlify env:list
   ```

### **Method 3: Using Setup Scripts**

Run the provided setup script:

**For Windows (PowerShell)**:
```powershell
.\scripts\setup-netlify-env.ps1
```

**For Linux/Mac (Bash)**:
```bash
chmod +x scripts/setup-netlify-env.sh
./scripts/setup-netlify-env.sh
```

## 📋 Getting Your Values

### **Database URLs (Supabase)**
1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the connection strings:
   - **DATABASE_URL**: Use the "Connection pooling" URL
   - **DIRECT_URL**: Use the "Direct connection" URL

### **Supabase Keys**
1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

### **JWT Secret**
Generate a strong random string:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use any strong password generator
```

## ✅ Verification

After setting up environment variables:

1. **Check in Netlify Dashboard**:
   - Go to Site settings → Environment variables
   - Verify all variables are listed

2. **Test with a new deploy**:
   - Trigger a new deployment
   - Check the build logs for any missing variables

3. **Use the health check**:
   - After deployment, visit: `https://your-site.netlify.app/.netlify/functions/health`
   - Should show environment status

## 🔒 Security Best Practices

1. **Never commit sensitive values** to your repository
2. **Use different values** for staging and production
3. **Rotate secrets regularly**, especially JWT secrets
4. **Limit access** to environment variables in your team
5. **Use Netlify's scoped variables** for different deploy contexts

## 🚨 Troubleshooting

### **Build fails with "Missing environment variable"**
- Check that all required variables are set in Netlify
- Verify variable names match exactly (case-sensitive)
- Ensure no extra spaces in variable names or values

### **Database connection fails**
- Verify DATABASE_URL and DIRECT_URL are correct
- Check that your Supabase project is active
- Ensure connection pooling URL is used for DATABASE_URL

### **JWT errors**
- Make sure JWT_SECRET is set and is a strong random string
- Verify JWT_EXPIRES_IN format (e.g., "7d", "24h", "3600s")

## 📞 Need Help?

If you encounter issues:
1. Check the [Netlify documentation](https://docs.netlify.com/environment-variables/overview/)
2. Review your build logs in the Netlify dashboard
3. Test environment variables locally first
4. Ensure your `.env.example` file is up to date for reference
