#!/bin/bash

# Netlify Build Script
# This script is executed during Netlify build process

set -e  # Exit on any error

echo "🚀 Starting Netlify build process..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Environment: $NODE_ENV"
echo "Build context: $CONTEXT"
echo "Branch: $BRANCH"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Install dependencies
log "📦 Installing dependencies..."
npm ci --production=false

# Validate environment
log "🔍 Validating environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set"
    exit 1
fi

# Generate Prisma client
log "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations for production
if [ "$NODE_ENV" = "production" ] && [ "$RUN_MIGRATIONS" = "true" ]; then
    log "🗄️ Running database migrations..."
    npx prisma migrate deploy
else
    log "⏭️ Skipping database migrations"
fi

# Build the application
log "🏗️ Building application..."
npm run build

# Verify build output
log "✅ Verifying build output..."
if [ ! -d "dist" ]; then
    echo "❌ Build directory 'dist' not found"
    exit 1
fi

if [ ! -f "dist/main.js" ]; then
    echo "❌ Main application file not found"
    exit 1
fi

# Create necessary directories for runtime
log "📁 Creating runtime directories..."
mkdir -p dist/uploads
mkdir -p dist/uploads/photos

# Copy static assets if they exist
if [ -d "public" ]; then
    log "📋 Copying static assets..."
    cp -r public/* dist/ 2>/dev/null || true
fi

# Set proper permissions
log "🔐 Setting permissions..."
chmod -R 755 dist/

# Display build summary
log "📊 Build Summary:"
echo "  - Build directory: dist/"
echo "  - Main file: dist/main.js"
echo "  - Size: $(du -sh dist/ | cut -f1)"
echo "  - Files: $(find dist/ -type f | wc -l)"

log "✅ Build completed successfully!"

# Optional: Run tests in CI
if [ "$RUN_TESTS" = "true" ]; then
    log "🧪 Running tests..."
    npm test
fi

echo "🎉 Netlify build process completed!"
