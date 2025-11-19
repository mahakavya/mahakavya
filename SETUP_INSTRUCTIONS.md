# Mahakavya Setup Instructions

## Critical Security Improvements Implemented

This guide will help you complete the setup after implementing the 5 critical security improvements.

## 1. Environment Variables Setup

All hardcoded credentials have been removed from the codebase. You MUST set these environment variables:

### Required Variables (Already Set via Vercel Integration)
These are automatically configured through your Supabase integration:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Database connection variables (POSTGRES_*)

### Recommended: Sentry Error Monitoring

To enable error monitoring, add these variables in the **Vars** section of the v0 sidebar:

1. **SENTRY_DSN**: Your Sentry project DSN
   - Get this from: https://sentry.io/settings/projects/
   - Format: `https://[key]@[org].ingest.sentry.io/[project-id]`

2. **SENTRY_AUTH_TOKEN** (optional): For source maps upload
   - Get this from: https://sentry.io/settings/account/api/auth-tokens/

Without these variables, error monitoring will be disabled but the app will still work.

### Optional Variables

Add these in the Vars section if needed:
- **RAZORPAY_KEY_ID**: Your Razorpay key (if already not set)
- **RAZORPAY_KEY_SECRET**: Your Razorpay secret (if already not set)
- **OPENAI_API_KEY**: For AI features
- **AI_SERVICE_URL**: Your AI service endpoint
- **BLOCKCHAIN_API_KEY**: For blockchain features

## 2. Database Security - Row Level Security (RLS)

Run the RLS policies script to secure your database:

### In v0:
The script `scripts/01-row-level-security-policies.sql` has been created. To run it:

1. Click the "Run Script" button that should appear for this file
2. The script will enable RLS on all tables and add comprehensive policies

### What This Does:
- Enables RLS on all 32 database tables
- Adds policies ensuring users can only access their own data
- Protects admin-only tables
- Secures conversation, messaging, and payment data

### Manual Verification:
After running, you can verify by checking the database schema in the Connect section of the sidebar.

## 3. Database Backup Setup

Run the backup setup script:

### In v0:
The script `scripts/02-database-backup-setup.sql` has been created. To run it:

1. Click the "Run Script" button for this file
2. The script will create backup and maintenance functions

### What This Provides:
- `create_data_snapshot()` - Creates snapshots of row counts
- `check_data_integrity()` - Checks for orphaned records
- `cleanup_old_data(days)` - Cleans up old data
- `get_database_health()` - Returns health metrics

### Schedule Backups:
For production, set up automated backups via Supabase:
1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Enable automatic backups (daily recommended)

## 4. Rate Limiting

Rate limiting is now active with these limits:

### Authentication
- Login: 5 attempts per 5 minutes
- Signup: 3 attempts per hour

### Content Creation  
- Posts: 10 per minute
- Comments: 30 per minute
- Reels: 5 per 5 minutes

### API Requests
- General: 100 per minute
- Search: 30 per minute
- Uploads: 10 per 5 minutes

Rate limit violations are logged to the `rate_events` table for monitoring.

## 5. Error Monitoring with Sentry

Once you add the SENTRY_DSN environment variable:

### Features Available:
- Automatic error capture
- User context tracking
- Performance monitoring
- Session replay for debugging
- Alert notifications

### Monitoring Dashboard:
View errors at: https://sentry.io/

### Best Practices:
- Review errors daily
- Set up alerts for critical errors
- Monitor error trends
- Use session replays to debug user issues

## Verification Checklist

Run through this checklist to ensure everything is set up correctly:

- [ ] All required environment variables are set
- [ ] RLS policies script has been executed successfully
- [ ] Database backup functions are created
- [ ] Test rate limiting by making multiple rapid requests
- [ ] Verify Sentry is receiving errors (trigger a test error)
- [ ] Check that hardcoded credentials are removed (search codebase)
- [ ] Verify RLS policies in Supabase dashboard
- [ ] Enable Supabase automatic backups
- [ ] Set up monitoring alerts in Sentry
- [ ] Review security documentation

## Testing

### Test Rate Limiting:
\`\`\`bash
# Make multiple rapid requests to test rate limiting
for i in {1..10}; do
  curl -X POST https://your-app.vercel.app/api/test-endpoint
done
\`\`\`

### Test Error Monitoring:
Add a test error in any API route:
\`\`\`typescript
throw new Error("Test error for Sentry monitoring")
\`\`\`

Check Sentry dashboard to confirm the error is captured.

### Test RLS Policies:
1. Create a test user
2. Try accessing another user's data
3. Verify access is denied

## Production Deployment

Before deploying to production:

1. ✅ Verify all environment variables are set in Vercel
2. ✅ Run both SQL scripts
3. ✅ Enable Supabase backups
4. ✅ Configure Sentry alerts
5. ✅ Test all security features
6. ✅ Review audit logs
7. ✅ Set up monitoring dashboards

## Support

For issues:
- Security concerns: Contact security team
- Database issues: Check Supabase logs
- Error monitoring: Check Sentry dashboard
- Rate limiting: Review `rate_events` table

## Next Steps

After completing this setup:
1. Review the security documentation in `docs/SECURITY.md`
2. Set up monitoring dashboards
3. Configure backup retention policies
4. Implement additional security measures as needed
5. Schedule regular security audits

## Important Notes

- **Never commit sensitive credentials to Git**
- **Rotate API keys regularly**
- **Monitor rate limit violations**
- **Review audit logs weekly**
- **Test backup restoration procedures**
- **Keep dependencies updated**

## Emergency Contacts

- Security issues: [Your security team contact]
- Production incidents: [On-call rotation]
- Database emergencies: [Database admin contact]
