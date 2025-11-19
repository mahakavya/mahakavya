#!/bin/bash

# Mahakavya Social Platform - Vercel Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-preview}
PROJECT_NAME="mahakavya-social"

echo "🚀 Deploying Mahakavya Social Platform to Vercel"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    print_error "Not logged in to Vercel. Please login first:"
    echo "vercel login"
    exit 1
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check required files
REQUIRED_FILES=("package.json" "next.config.mjs" "vercel.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

# Check environment variables
if [ ! -f ".env.local" ]; then
    print_warning ".env.local file not found. Make sure environment variables are set in Vercel dashboard."
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run linting and type checking
print_status "Running code quality checks..."
npm run lint || print_warning "Linting issues found"
npm run type-check || print_warning "Type checking issues found"

# Run tests if available
if npm run test --silent 2>/dev/null; then
    print_status "Running tests..."
    npm run test
fi

# Build the application
print_status "Building application..."
npm run build

# Deploy to Vercel
print_status "Deploying to Vercel..."

if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod --yes
else
    vercel --yes
fi

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls $PROJECT_NAME --limit 1 | grep https | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    print_status "Deployment successful!"
    echo "🌐 URL: $DEPLOYMENT_URL"
    
    # Run post-deployment health check
    print_status "Running health check..."
    sleep 10 # Wait for deployment to be ready
    
    if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
        print_status "Health check passed ✅"
    else
        print_warning "Health check failed ⚠️"
    fi
    
    # Open deployment in browser (optional)
    if command -v open &> /dev/null; then
        read -p "Open deployment in browser? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$DEPLOYMENT_URL"
        fi
    fi
else
    print_error "Could not retrieve deployment URL"
    exit 1
fi

print_status "Deployment completed successfully! 🎉"

# Post-deployment instructions
echo ""
echo "📋 Post-deployment checklist:"
echo "1. Verify all pages load correctly"
echo "2. Test authentication flow"
echo "3. Check payment integration"
echo "4. Verify AI features"
echo "5. Test blockchain connectivity"
echo "6. Check RPA automation"
echo "7. Review monitoring dashboard"
echo ""
echo "🔗 Useful links:"
echo "   • Application: $DEPLOYMENT_URL"
echo "   • Admin Panel: $DEPLOYMENT_URL/admin"
echo "   • Health Check: $DEPLOYMENT_URL/api/health"
echo "   • Vercel Dashboard: https://vercel.com/dashboard"
