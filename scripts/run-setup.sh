#!/bin/bash

echo "🚀 Running Mahakavya Supabase Setup..."

# Check if we're in the right directory
if [ ! -f "scripts/setup-supabase.sh" ]; then
    echo "❌ Setup script not found. Please run from project root."
    exit 1
fi

# Make setup script executable
chmod +x scripts/setup-supabase.sh

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Please configure your environment:"
    echo ""
    echo "1. Copy .env.local to your actual environment file"
    echo "2. Replace placeholder values with your actual Supabase credentials"
    echo "3. Set DATABASE_URL environment variable"
    echo ""
    echo "Example:"
    echo "export DATABASE_URL='postgresql://postgres:password@db.project.supabase.co:5432/postgres'"
    echo ""
    echo "Then run: ./scripts/setup-supabase.sh"
    exit 1
fi

# Run the setup script
echo "📊 Executing database setup..."
./scripts/setup-supabase.sh

echo ""
echo "✅ Setup complete! Next steps:"
echo "1. Update your .env.local with actual Supabase credentials"
echo "2. Create storage buckets in Supabase dashboard"
echo "3. Run: npm run dev"
echo "4. Test the application"
