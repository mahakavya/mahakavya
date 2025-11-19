# Mahakavya Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env.local` and fill in all required values
- [ ] Set `NODE_ENV=production` in your deployment environment
- [ ] Configure Supabase project URL and keys
- [ ] Set up Razorpay keys (if using payments)
- [ ] Generate VAPID keys for push notifications (if needed)

### 2. Database Setup
\`\`\`bash
# Run database migrations
npm run db:migrate

# Verify database schema
npm run db:verify

# Create first admin user
npm run setup:admin
\`\`\`

### 3. Production Readiness Check
\`\`\`bash
# Run comprehensive production check
npm run production-check

# Fix automated issues
npm run fix-issues

# View deployment checklist
npm run deployment-checklist
\`\`\`

### 4. Build and Test
\`\`\`bash
# Type check
npm run type-check

# Build application
npm run build

# Test production build locally
npm run start
\`\`\`

## Deployment Steps

### Vercel Deployment (Recommended)

1. **Connect Repository**
   \`\`\`bash
   vercel --prod
   \`\`\`

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.example`

3. **Configure Domain**
   - Add custom domain in Vercel Dashboard
   - Update `NEXT_PUBLIC_BASE_URL` environment variable

### Manual Deployment

1. **Build Application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Deploy Files**
   - Upload `.next`, `public`, and other necessary files
   - Ensure Node.js 18+ is available on server

3. **Start Application**
   \`\`\`bash
   npm run start
   \`\`\`

## Post-Deployment

### 1. Verify Functionality
- [ ] Test user registration/login
- [ ] Test all major features
- [ ] Verify database connections
- [ ] Test API endpoints
- [ ] Check mobile responsiveness

### 2. Configure Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error tracking (Sentry recommended)
- [ ] Set up performance monitoring
- [ ] Configure log aggregation

### 3. Security Verification
- [ ] Verify HTTPS is working
- [ ] Test authentication flows
- [ ] Verify RLS policies are active
- [ ] Check security headers

### 4. Performance Optimization
- [ ] Configure CDN for static assets
- [ ] Enable compression
- [ ] Optimize images
- [ ] Test loading speeds

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies allow access

2. **Build Failures**
   - Run `npm run type-check` to find TypeScript errors
   - Check for missing dependencies
   - Verify environment variables

3. **Authentication Issues**
   - Verify Supabase configuration
   - Check middleware configuration
   - Ensure cookies are working

4. **Payment Integration Issues**
   - Verify Razorpay keys
   - Check webhook configuration
   - Test in sandbox mode first

### Support

For deployment support:
- Check the troubleshooting guide
- Review application logs
- Contact the development team

## Maintenance

### Regular Tasks
- Monitor application performance
- Update dependencies regularly
- Backup database regularly
- Review security logs
- Update documentation

### Updates
- Test updates in staging first
- Use blue-green deployment for zero downtime
- Monitor for issues after deployment
- Have rollback plan ready
