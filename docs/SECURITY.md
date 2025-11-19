# Security Documentation

## Overview

This document outlines the security measures implemented in the Mahakavya Social Platform.

## 1. Authentication & Authorization

### Supabase Authentication
- Email/password authentication with secure session management
- JWT tokens with 30-second caching to prevent excessive requests
- Automatic token refresh via middleware
- Protected routes with role-based access control (RBAC)

### Admin Access
- Admin routes protected at middleware level
- Admin status verified from `profiles.is_admin` field
- Separate admin API endpoints with role verification

## 2. Row Level Security (RLS)

All database tables have RLS policies implemented:

### Core Tables
- **profiles**: Users can view all, update own; admins can manage all
- **posts**: Anyone can view, users create/update own; admins manage all
- **reels**: Similar to posts with like tracking
- **campaigns**: Public viewing, user creation, owner updates
- **donations**: Public viewing, user creation

### Social Features
- **post_comments**: Public viewing, user creation/updates
- **post_likes**: Users manage own likes, view all
- **conversations**: Users view own, create new
- **messages**: Members-only access for viewing and sending

### Support Systems
- **listeners**: Public viewing of active, users manage own profiles
- **sessions**: Participant-only access (seeker + listener)
- **slots**: Public viewing of available, listeners manage own

### Admin-Only Tables
- **audit_logs**: Admin access only
- **rate_events**: Admin access only
- **safety_flags**: Admin access only
- **reports**: Users create and view own; admins manage all

## 3. Rate Limiting

Comprehensive rate limiting implemented across all endpoints:

### Authentication
- Login: 5 attempts per 5 minutes
- Signup: 3 attempts per hour
- Password reset: 3 attempts per hour

### Content Creation
- Posts: 10 per minute
- Comments: 30 per minute
- Reels: 5 per 5 minutes
- Campaigns: 3 per hour

### Social Interactions
- Likes: 100 per minute
- Follows: 50 per minute

### Messaging
- Messages: 60 per minute

### Payments
- Payments: 10 per minute
- Donations: 5 per 5 minutes

### API Requests
- General: 100 per minute
- Search: 30 per minute
- Uploads: 10 per 5 minutes

### Admin Operations
- Admin actions: 100 per minute
- Bulk operations: 5 per 5 minutes

Rate limit events are logged to the `rate_events` table for monitoring.

## 4. Error Monitoring

### Sentry Integration
- Automatic error capture and reporting
- User context tracking
- Performance monitoring
- Session replay for debugging
- Environment-based filtering (production only)

### Error Handling
- All API routes use try-catch blocks
- Errors logged to Sentry with context
- User-friendly error messages
- Rate limit errors tracked separately

## 5. Environment Variables

### Security Best Practices
- No hardcoded credentials in code
- All secrets stored in environment variables
- Separate development and production configs
- Service role key never exposed to client
- Environment validation on startup

### Required Variables
\`\`\`
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SENTRY_DSN (optional but recommended)
\`\`\`

## 6. Data Protection

### Input Validation
- Zod schemas for all user inputs
- Type checking at runtime
- SQL injection protection via Supabase
- XSS prevention through React's built-in escaping

### Content Moderation
- AI-powered safety scoring
- User reporting system
- Admin moderation queue
- Content hiding/unhiding capabilities

### Privacy Controls
- User-specific data access
- Shadow muting for admin moderation
- Account deletion requests
- Notification preferences

## 7. Database Security

### Backup & Recovery
- Automated snapshot functions
- Data integrity checks
- Orphaned record detection
- Automated cleanup of old data

### Maintenance
- Regular cleanup of rate limit events (90 days)
- Audit log retention (1 year)
- Analytics event cleanup (90 days)
- Inactive subscription cleanup (180 days)

## 8. API Security

### Request Validation
- Authentication required for protected endpoints
- Rate limiting on all endpoints
- Input validation with Zod
- CORS configuration

### Response Headers
- Rate limit headers included
- Retry-After headers for 429 responses
- Proper content-type headers
- Cache control headers

## 9. Monitoring & Alerts

### Database Health
- Row count monitoring
- Storage size tracking
- Largest table identification
- Active user metrics

### Security Events
- Failed authentication attempts
- Rate limit violations
- Data integrity issues
- Admin actions (audit log)

## 10. Compliance

### Data Privacy
- User data ownership
- Data export capabilities
- Account deletion process
- Privacy preferences

### Content Safety
- AI moderation
- User reporting
- Admin review process
- Content hiding mechanisms

## Best Practices

1. **Never commit secrets to Git**
2. **Always use environment variables for sensitive data**
3. **Test RLS policies before deploying**
4. **Monitor rate limit violations**
5. **Review audit logs regularly**
6. **Keep dependencies updated**
7. **Run security audits periodically**
8. **Backup database regularly**
9. **Test disaster recovery procedures**
10. **Document all security changes**

## Emergency Procedures

### Security Breach
1. Revoke compromised API keys immediately
2. Rotate all secrets
3. Check audit logs for unauthorized access
4. Notify affected users if data was exposed
5. Document incident and response

### Database Corruption
1. Stop write operations
2. Restore from latest backup
3. Run integrity checks
4. Verify data accuracy
5. Resume operations

### Rate Limit Attack
1. Check rate_events table for patterns
2. Temporarily lower rate limits
3. Block suspicious IPs if necessary
4. Monitor for continued attacks
5. Adjust limits as needed

## Contact

For security concerns or to report vulnerabilities, please contact the security team.
