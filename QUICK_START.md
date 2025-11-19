# 🚀 Quick Start Guide - Mahakavya Platform

Get your Mahakavya social platform running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Supabase account
- Vercel account (for deployment)

## Step 1: Clone & Install (2 minutes)

\`\`\`bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
\`\`\`

## Step 2: Configure Supabase (2 minutes)

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Copy your project URL and anon key
4. Add to `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

## Step 3: Run Database Scripts (1 minute)

Execute these scripts in Supabase SQL Editor:

1. `scripts/01-row-level-security-policies.sql`
2. `scripts/02-database-backup-setup.sql`
3. `scripts/03-database-optimization.sql`

## Step 4: Start Development (30 seconds)

\`\`\`bash
# Start the dev server
pnpm dev

# Open http://localhost:3000
\`\`\`

## Step 5: Deploy to Production (Optional)

\`\`\`bash
# Deploy to Vercel
vercel --prod

# Or use the v0 "Publish" button
\`\`\`

## That's It! 🎉

Your Mahakavya platform is ready. Features available:

- ✅ Social feed with posts & comments
- ✅ Video reels with HLS streaming
- ✅ Direct messaging & groups
- ✅ Fundraising campaigns
- ✅ Peer support system
- ✅ Lucky draws
- ✅ Admin dashboard
- ✅ AI-powered features
- ✅ Blockchain verification

## Need Help?

- See `DEPLOYMENT_CHECKLIST.md` for detailed setup
- Check `docs/DEPLOYMENT_TROUBLESHOOTING.md` for issues
- Review `docs/PRODUCTION_READINESS_REPORT.md` for features

## Test Accounts

After deployment, create test accounts via:
- Signup page: `/auth/sign-up`
- Admin setup: First user is auto-admin

Enjoy your platform! 🚀
