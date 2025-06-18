#!/bin/bash

# Netlify Environment Variables Setup Script
# Run this script to set up environment variables using Netlify CLI

echo "🔧 Setting up Netlify environment variables..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Please install it first:"
    echo "npm install -g netlify-cli"
    exit 1
fi

# Check if user is logged in
if ! netlify status &> /dev/null; then
    echo "❌ Please log in to Netlify first:"
    echo "netlify login"
    exit 1
fi

echo "📝 Setting environment variables..."

# Required environment variables
netlify env:set NODE_ENV "production"
netlify env:set PORT "3000"
netlify env:set SOCKET_PORT "3001"
netlify env:set MAX_FILE_SIZE "10485760"
netlify env:set UPLOAD_DEST "./uploads"
netlify env:set JWT_EXPIRES_IN "7d"

echo "✅ Basic environment variables set!"
echo ""
echo "🔐 You still need to set these sensitive variables manually:"
echo "   - DATABASE_URL"
echo "   - DIRECT_URL"
echo "   - JWT_SECRET"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Set them using:"
echo "netlify env:set DATABASE_URL 'your_database_url'"
echo "netlify env:set JWT_SECRET 'your_jwt_secret'"
echo "# ... and so on"
echo ""
echo "Or set them in the Netlify dashboard: Site settings → Environment variables"
