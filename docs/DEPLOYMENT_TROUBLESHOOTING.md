# Deployment Troubleshooting Guide

## Common Deployment Errors

### Error: "Your project's URL and Key are required to create a Supabase client"

**Cause:** The Supabase environment variables are not properly configured in your deployment environment.

**Solution:**

1. **Check Environment Variables in Vercel Dashboard**
   - Go to your Vercel project dashboard
   - Click on "Settings" → "Environment Variables"
   - Verify that the following variables are set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Get Your Supabase Credentials**
   - Go to your Supabase project dashboard: https://supabase.com/dashboard
   - Select your project
   - Go to Settings → API
   - Copy the following:
     - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
     - **Project API Key (anon public)** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Project API Key (service_role)** → Use for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

3. **Add Variables in v0**
   - Click on the "Vars" tab in the left sidebar of v0
   - Add each environment variable
   - Make sure to use the exact names listed above

4. **Redeploy**
   - After adding the environment variables, redeploy your application
   - The error should be resolved

### Error: "Please add source code to this block"

**Cause:** Empty code blocks in markdown files or missing file content.

**Solution:**
- Check all markdown files in the `docs/` directory
- Ensure all code blocks have content
- Remove any empty code blocks (```language ... ```)

### Error: "Module not found" or Import Errors

**Cause:** Missing dependencies or incorrect import paths.

**Solution:**

1. **Check package.json**
   - Verify all dependencies are listed
   - Run `npm install` or `pnpm install`

2. **Check import paths**
   - Make sure all imports use absolute paths (starting with `@/` or full module names)
   - Verify that the imported files exist

3. **Clear cache and rebuild**
   \`\`\`bash
   rm -rf .next
   rm -rf node_modules
   pnpm install
   pnpm build
   \`\`\`

## Environment Variables Reference

### Required Variables

These MUST be set for the application to work:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (auto-configured by Supabase integration)
POSTGRES_URL=your-postgres-url
POSTGRES_PRISMA_URL=your-prisma-url
\`\`\`

### Optional Variables

These enhance functionality but aren't required:

\`\`\`env
# Payments
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# AI Features
AI_SERVICE_URL=your-ai-service-url
AI_MODERATION_URL=your-moderation-url
OPENAI_API_KEY=your-openai-key

# Blockchain
BLOCKCHAIN_API_KEY=your-blockchain-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature Flags
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_BLOCKCHAIN=true
ENABLE_ANALYTICS=true

# Limits
MAX_FILE_SIZE=10485760
NEXT_PUBLIC_MAX_REEL_DURATION_SECONDS=60
\`\`\`

## Vercel Deployment Checklist

- [ ] All environment variables added in Vercel dashboard
- [ ] Supabase integration connected
- [ ] Database migrations applied
- [ ] Build successful locally
- [ ] No TypeScript errors
- [ ] All API routes tested
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

## Quick Fixes

### Fix 1: Environment Variables Not Loading

If environment variables work locally but not in production:

1. In Vercel, go to Settings → Environment Variables
2. Make sure variables are enabled for "Production" environment
3. Redeploy the application

### Fix 2: Database Connection Errors

If you see database connection errors:

1. Check that your Supabase project is active
2. Verify connection pooling is enabled in Supabase
3. Check that RLS policies are properly configured
4. Run the database health check: `GET /api/health`

### Fix 3: Build Errors

If the build fails:

1. Check the build logs in Vercel
2. Look for TypeScript errors
3. Verify all imports are correct
4. Check for missing dependencies in package.json
5. Try building locally: `pnpm build`

## Getting Help

If you continue to experience issues:

1. Check the v0 debug logs
2. Review the Vercel deployment logs
3. Check Supabase dashboard for any service issues
4. Review the Security documentation: `docs/SECURITY.md`
5. Contact support with:
   - Error message
   - Deployment logs
   - Environment configuration (without sharing keys)
   - Steps to reproduce

## Monitoring Deployment Health

After deployment, monitor these endpoints:

- **Health Check:** `GET /api/health` - Should return `{ status: "ok" }`
- **Database Check:** Look for database connection in health response
- **Sentry:** Check for error reports
- **Analytics:** Verify events are being tracked

## Production Best Practices

1. **Always use environment variables** - Never hardcode credentials
2. **Enable error monitoring** - Set up Sentry before launch
3. **Test payment flows** - Verify Razorpay integration in test mode
4. **Run database migrations** - Apply all SQL scripts in order
5. **Monitor performance** - Watch API response times
6. **Set up alerts** - Configure Sentry alerts for critical errors
7. **Backup database** - Ensure automated backups are running
8. **Review logs regularly** - Check for errors and warnings
9. **Keep dependencies updated** - Update packages regularly
10. **Test before deploying** - Always test changes locally first

---

**Last Updated:** Current Session  
**Status:** Production Deployment Guide
