# Vercel Deployment Guide for Mahakavya Social Platform

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Code should be pushed to GitHub
3. **Supabase Project**: Database and authentication setup
4. **Environment Variables**: All required environment variables configured

## Quick Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "mahakavya-social" repository

### 2. Configure Build Settings

Vercel will auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### 3. Environment Variables

Add these environment variables in Vercel Dashboard:

#### Database & Authentication
\`\`\`bash
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_HOST=your_postgres_host
POSTGRES_DATABASE=your_postgres_database

SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
\`\`\`

#### Payments
\`\`\`bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
\`\`\`

#### AI Services
\`\`\`bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_AI_ENABLED=true
AI_MODEL_VERSION=gpt-4
AI_MAX_TOKENS=2000
\`\`\`

#### Blockchain
\`\`\`bash
BLOCKCHAIN_NETWORK=ethereum
BLOCKCHAIN_RPC_URL=your_blockchain_rpc_url
BLOCKCHAIN_PRIVATE_KEY=your_blockchain_private_key
NEXT_PUBLIC_BLOCKCHAIN_ENABLED=true
\`\`\`

#### RPA & Automation
\`\`\`bash
RPA_SERVICE_URL=your_rpa_service_url
RPA_API_KEY=your_rpa_api_key
NEXT_PUBLIC_RPA_ENABLED=true
\`\`\`

#### Security & Monitoring
\`\`\`bash
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.vercel.app
WEBHOOK_SECRET=your_webhook_secret
ENCRYPTION_KEY=your_encryption_key
\`\`\`

### 4. Deploy

1. Click "Deploy" in Vercel Dashboard
2. Wait for build to complete (usually 2-5 minutes)
3. Verify deployment at provided URL

## Post-Deployment Setup

### 1. Database Migration

Run database migrations after first deployment:

\`\`\`bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:migrate
\`\`\`

### 2. Admin User Setup

Create first admin user:

\`\`\`bash
npm run setup:admin
\`\`\`

### 3. Verify Services

Check all services are working:

1. Visit `/api/health` - Should return 200 OK
2. Test authentication flow
3. Verify payment integration
4. Check AI features
5. Test blockchain connectivity
6. Verify RPA automation

## Domain Configuration

### Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Environment-Specific URLs

Update these environment variables with your domain:

\`\`\`bash
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## Performance Optimization

### 1. Edge Functions

Critical API routes are configured for edge runtime:
- Authentication endpoints
- Real-time features
- AI processing endpoints

### 2. Caching Strategy

- Static assets: 1 year cache
- API responses: Configured per endpoint
- Database queries: Redis caching enabled

### 3. CDN Configuration

Vercel automatically configures global CDN for:
- Static assets
- Images (Next.js Image Optimization)
- API responses (where appropriate)

## Monitoring & Analytics

### 1. Vercel Analytics

Enable in Project Settings:
- Web Analytics
- Speed Insights
- Function logs

### 2. Error Tracking

Integrated error tracking:
- API route errors
- Client-side errors
- Performance monitoring

### 3. Custom Monitoring

Access monitoring dashboard at `/admin/monitoring`

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables
   - Verify dependencies in package.json
   - Review build logs

2. **Database Connection Issues**
   - Verify Supabase connection strings
   - Check IP allowlisting
   - Test connection pooling settings

3. **Authentication Problems**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check Supabase auth configuration
   - Validate JWT secrets

4. **Payment Integration Issues**
   - Verify Razorpay credentials
   - Check webhook endpoints
   - Test in sandbox mode first

### Support

For deployment issues:
1. Check Vercel deployment logs
2. Review application logs in `/admin/monitoring`
3. Contact support through admin panel

## Security Checklist

- [ ] All environment variables configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection active
- [ ] XSS protection enabled
- [ ] CSRF protection configured

## Maintenance

### Regular Tasks

1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Review and rotate API keys
4. **Annually**: Security audit and penetration testing

### Backup Strategy

- Database: Automated daily backups via Supabase
- Files: Stored in Supabase Storage with replication
- Configuration: Version controlled in Git

## Scaling Considerations

### Traffic Growth

- Vercel automatically scales serverless functions
- Database connection pooling configured
- CDN handles static asset scaling

### Feature Expansion

- Modular architecture supports new features
- API versioning strategy in place
- Database schema migration system

---

**Deployment Date**: $(date)
**Version**: 1.0.0
**Environment**: Production
