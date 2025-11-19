# Database Migration Guide

This guide will help you set up the complete database schema for the Mahakavya Social Platform.

## Prerequisites

1. **Supabase Project**: Create a new project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up your `.env.local` file with Supabase credentials
3. **Node.js**: Ensure you have Node.js 18+ installed

## Method 1: Automated Migration (Recommended)

### Step 1: Install Dependencies
\`\`\`bash
npm install
\`\`\`

### Step 2: Set Environment Variables
Create `.env.local` file:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

### Step 3: Run Migrations
\`\`\`bash
npm run migrate
\`\`\`

### Step 4: Verify Setup
\`\`\`bash
npm run db:verify
\`\`\`

## Method 2: Manual Migration via Supabase Dashboard

### Step 1: Access SQL Editor
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor"
3. Create a new query

### Step 2: Execute Migration Files
Execute the following files in order:

1. **001_initial_schema.sql** - Creates all tables and types
2. **002_rls_policies.sql** - Sets up security policies
3. **003_indexes.sql** - Adds performance indexes
4. **004_functions.sql** - Creates database functions and triggers
5. **005_seed_data.sql** - Adds sample data

Copy the content of each file and run them one by one.

## Method 3: Supabase CLI

### Step 1: Install Supabase CLI
\`\`\`bash
npm install -g supabase
\`\`\`

### Step 2: Login and Link Project
\`\`\`bash
supabase login
supabase link --project-ref your-project-ref
\`\`\`

### Step 3: Push Migrations
\`\`\`bash
supabase db push
\`\`\`

## Post-Migration Setup

### 1. Create Your Admin User
1. Sign up for an account in your application
2. Run this SQL in Supabase SQL Editor:
\`\`\`sql
SELECT setup_admin_user('your-email@example.com');
\`\`\`

### 2. Configure Storage Buckets
Create these storage buckets in Supabase Storage:
- `avatars` - For user profile pictures
- `posts` - For post media
- `campaigns` - For campaign images
- `reels` - For video content

### 3. Set Storage Policies
For each bucket, add these RLS policies:
\`\`\`sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (true);
\`\`\`

## Verification Checklist

After running migrations, verify:

- [ ] All 19 tables created successfully
- [ ] RLS policies enabled on all tables
- [ ] Database functions working
- [ ] Triggers firing correctly
- [ ] Sample draws data inserted
- [ ] Admin user setup completed
- [ ] Storage buckets configured

## Troubleshooting

### Common Issues

**1. Permission Denied Errors**
- Ensure you're using the service role key, not the anon key
- Check that RLS policies allow the operation

**2. Function Already Exists**
- This is normal - the migration script handles existing functions
- The script will continue with other operations

**3. Table Already Exists**
- Safe to ignore - indicates partial migration was successful
- Re-run the migration to complete remaining steps

**4. Connection Timeout**
- Check your internet connection
- Verify Supabase project is active
- Ensure environment variables are correct

### Getting Help

If you encounter issues:

1. Check the Supabase dashboard for error details
2. Review the migration logs for specific errors
3. Verify your environment variables are correct
4. Ensure your Supabase project has sufficient resources

## Database Schema Overview

The migration creates these main components:

### Core Tables
- `profiles` - User profiles and settings
- `posts` - Social media posts
- `comments` - Post comments
- `follows` - User follow relationships

### Feature Tables
- `campaigns` - Fundraising campaigns
- `donations` - Campaign donations
- `draws` - Lucky draw contests
- `reels` - Short video content
- `messages` - Direct messaging
- `sahaya_sessions` - Support sessions

### System Tables
- `notifications` - User notifications
- `analytics_events` - Usage analytics
- `reports` - Content moderation
- `feature_access` - Feature permissions

### Security Features
- Row Level Security (RLS) on all tables
- User-based access control
- Admin-only operations protection
- Content moderation policies

The database is now ready for production use with all social media features, real-time updates, and secure data access!
