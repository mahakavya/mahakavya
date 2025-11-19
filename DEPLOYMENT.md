# Mahakavya Social Platform - Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Razorpay account (for payments)
- Vercel account (recommended for deployment)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URLs (provided by Supabase)
POSTGRES_URL=your_postgres_connection_string
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_non_pooling_url
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database

# Razorpay Configuration (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Push Notifications (generate using scripts/generate-vapid.mjs)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret_key
\`\`\`

## Overview
This guide covers the deployment process for the Mahakavya social platform, an AI-powered community platform with heritage-inspired features.

## Deployment Steps

### 1. Local Development Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/mahakavya-social.git
cd mahakavya-social

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
\`\`\`

### 2. Supabase Setup

\`\`\`bash
# Run the Supabase setup script
npm run setup:supabase

# Or manually run SQL migrations in Supabase dashboard
# Execute files in supabase/migrations/ in order
\`\`\`

### 3. Razorpay Setup (Optional - for payments)

\`\`\`bash
# Configure Razorpay
npm run setup:razorpay
\`\`\`

### 4. Generate VAPID Keys (for push notifications)

\`\`\`bash
# Generate VAPID keys for push notifications
npm run setup:vapid
\`\`\`

### 5. Deploy to Vercel

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/mahakavya-social)

#### Option B: Manual Deploy
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Go to Project Settings > Environment Variables
# Add all variables from your .env.local file
\`\`\`

### 6. Post-Deployment Setup

1. **Admin Setup**: Visit `/admin/setup` to configure your first admin user
2. **Database Verification**: Run `npm run db:verify` to check database setup
3. **Production Check**: Run `npm run production-check` to verify deployment

## 🔧 Configuration

### Database Configuration
- The app uses Supabase PostgreSQL with Row Level Security (RLS)
- All migrations are in `supabase/migrations/`
- Database functions and triggers are automatically set up

### Authentication
- Supabase Auth handles user authentication
- Social logins supported (Google, GitHub, etc.)
- Email/password authentication included

### File Storage
- Supabase Storage for user uploads
- Automatic image optimization
- CDN delivery for fast loading

### Real-time Features
- Supabase Realtime for live updates
- WebSocket connections for chat
- Push notifications via Web Push API

## 🛠️ Advanced Configuration

### Custom Domain Setup
1. Add your domain in Vercel dashboard
2. Update `NEXT_PUBLIC_APP_URL` environment variable
3. Configure DNS records as instructed by Vercel

### SSL Certificate
- Automatically handled by Vercel
- Custom certificates supported for enterprise

### Performance Optimization
- Built-in Next.js optimizations
- Image optimization enabled
- Static generation for public pages
- Edge functions for API routes

## 📊 Monitoring & Analytics

### Built-in Analytics
- User engagement tracking
- Performance monitoring
- Error tracking and reporting

### External Integrations
- Google Analytics (optional)
- Sentry for error tracking (optional)
- Custom analytics dashboard in admin panel

## 🔒 Security Features

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- CSRF protection
- Rate limiting on API endpoints

### Privacy Compliance
- GDPR compliance features
- Data export functionality
- Account deletion with data cleanup
- Privacy-focused analytics

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   \`\`\`bash
   # Clear cache and reinstall
   rm -rf .next node_modules
   npm install
   npm run build
   \`\`\`

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check database migrations status
   - Ensure RLS policies are applied

3. **Authentication Problems**
   - Verify Supabase auth configuration
   - Check redirect URLs in Supabase dashboard
   - Ensure environment variables are set correctly

4. **Performance Issues**
   - Enable caching in production
   - Optimize images and assets
   - Use CDN for static content

### Getting Help
- Check the [troubleshooting guide](docs/TROUBLESHOOTING.md)
- Review [common issues](docs/COMMON_ISSUES.md)
- Contact support at support@mahakavya.social

## 📈 Scaling Considerations

### Database Scaling
- Supabase handles automatic scaling
- Consider read replicas for high traffic
- Implement caching strategies

### Application Scaling
- Vercel automatically scales serverless functions
- Consider edge deployment for global users
- Implement CDN for static assets

### Monitoring at Scale
- Set up alerts for critical metrics
- Monitor database performance
- Track user experience metrics

---

**Security Note**: Never commit sensitive environment variables to your repository. Always use environment variable management tools and keep your secrets secure.

For detailed setup instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md).
