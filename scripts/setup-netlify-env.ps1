# Netlify Environment Variables Setup Script (PowerShell)
# Run this script to set up environment variables using Netlify CLI

Write-Host "🔧 Setting up Netlify environment variables..." -ForegroundColor Cyan

# Check if Netlify CLI is installed
try {
    netlify --version | Out-Null
} catch {
    Write-Host "❌ Netlify CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g netlify-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    netlify status | Out-Null
} catch {
    Write-Host "❌ Please log in to Netlify first:" -ForegroundColor Red
    Write-Host "netlify login" -ForegroundColor Yellow
    exit 1
}

Write-Host "📝 Setting environment variables..." -ForegroundColor Green

# Required environment variables
netlify env:set NODE_ENV "production"
netlify env:set PORT "3000"
netlify env:set SOCKET_PORT "3001"
netlify env:set MAX_FILE_SIZE "10485760"
netlify env:set UPLOAD_DEST "./uploads"
netlify env:set JWT_EXPIRES_IN "7d"

Write-Host "✅ Basic environment variables set!" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 You still need to set these sensitive variables manually:" -ForegroundColor Yellow
Write-Host "   - DATABASE_URL"
Write-Host "   - DIRECT_URL"
Write-Host "   - JWT_SECRET"
Write-Host "   - SUPABASE_URL"
Write-Host "   - SUPABASE_ANON_KEY"
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY"
Write-Host ""
Write-Host "Set them using:" -ForegroundColor Cyan
Write-Host "netlify env:set DATABASE_URL 'your_database_url'"
Write-Host "netlify env:set JWT_SECRET 'your_jwt_secret'"
Write-Host "# ... and so on"
Write-Host ""
Write-Host "Or set them in the Netlify dashboard: Site settings → Environment variables" -ForegroundColor Cyan
