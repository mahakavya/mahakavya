# Supabase Setup Guide

This guide will help you set up Supabase for the Mahakavya Social platform.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed locally

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `mahakavya-social`
   - **Database Password**: Generate a strong password
   - **Region**: Choose the closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" under Settings
4. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Update the values in `.env.local`:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_DEMO_MODE=false
   \`\`\`

## Step 4: Run Database Migrations

1. Install Supabase CLI:
   \`\`\`bash
   npm install -g supabase
   \`\`\`

2. Login to Supabase:
   \`\`\`bash
   supabase login
   \`\`\`

3. Link your project:
   \`\`\`bash
   supabase link --project-ref your-project-ref
   \`\`\`

4. Run the migrations:
   \`\`\`bash
   supabase db push
   \`\`\`

   Or manually run each migration file in the Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_indexes.sql`
   - `supabase/migrations/004_functions.sql`
   - `supabase/migrations/005_seed_data.sql`

## Step 5: Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Configure your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production domain when deploying

3. Enable the authentication providers you want:
   - Email/Password (enabled by default)
   - Google OAuth (optional)
   - GitHub OAuth (optional)

## Step 6: Set Up Storage (Optional)

If you plan to upload images/videos:

1. Go to Storage in your Supabase dashboard
2. Create buckets:
   - `avatars` (for profile pictures)
   - `posts` (for post media)
   - `campaigns` (for campaign images)
   - `reels` (for video content)

3. Set up storage policies for each bucket

## Step 7: Configure Row Level Security

The migrations include RLS policies, but you can review and modify them:

1. Go to Authentication > Policies in your Supabase dashboard
2. Review the policies for each table
3. Modify as needed for your security requirements

## Step 8: Test the Connection

1. Start your development server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Try to sign up/sign in to test the authentication
3. Check that data is being saved to your Supabase database

## Production Deployment

When deploying to production:

1. Update your environment variables in your hosting platform
2. Update the Site URL in Supabase Authentication settings
3. Add your production domain to Redirect URLs
4. Consider setting up database backups
5. Monitor your usage and upgrade your Supabase plan if needed

## Troubleshooting

### Common Issues

1. **"Invalid JWT" errors**: Check that your environment variables are correct
2. **RLS policy errors**: Ensure your policies allow the operations you're trying to perform
3. **Connection errors**: Verify your Supabase URL and keys are correct

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Join the [Supabase Discord](https://discord.supabase.com)
- Review the application logs for specific error messages

## Security Best Practices

1. Never commit your `.env.local` file to version control
2. Use the service role key only in server-side code
3. Regularly rotate your API keys
4. Monitor your database for unusual activity
5. Keep your RLS policies up to date
6. Use HTTPS in production
7. Implement proper input validation and sanitization

## Monitoring and Maintenance

1. Set up database monitoring in Supabase dashboard
2. Monitor API usage and performance
3. Regularly backup your database
4. Keep track of storage usage
5. Update dependencies regularly
6. Monitor error logs and fix issues promptly
