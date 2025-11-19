# Mahakavya Social - Deployment Guide

This guide covers deploying Mahakavya Social to Vercel with Supabase and Razorpay integration.

## Prerequisites

- Vercel account
- Supabase project
- Razorpay account (test/live)
- Node.js 20+

## 1. Vercel Project Setup

### Create Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from Git repository
4. Framework: **Next.js**
5. Node.js Version: **20.x**
6. Build Command: `npm run build`
7. Install Command: `npm ci`

### Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

#### Production & Preview
\`\`\`bash
# App
NEXT_PUBLIC_BASE_URL=https://mahakavya.vercel.app
NEXT_PUBLIC_GUARD_DISABLED=0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SERVICE_ROLE_KEY=your_service_role_key

# Razorpay (Server-side only)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
\`\`\`

## 2. Supabase Setup

### Database Schema
1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL files in order:
   - `supabase/sql/001_schema.sql`
   - `supabase/sql/002_rls.sql` 
   - `supabase/sql/003_indexes.sql`

### Authentication
1. Go to Authentication → Settings
2. Configure allowed domains: `mahakavya.vercel.app`
3. Set up email templates (optional)

## 3. Razorpay Setup

### Plans
1. Go to Razorpay Dashboard → Subscriptions → Plans
2. Create monthly plan: ₹499/month
3. Copy the plan ID and update `PLAN_ID_MONTHLY` in `config/payments.ts`

### Webhooks
1. Go to Razorpay Dashboard → Webhooks
2. Create webhook with URL: `https://mahakavya.vercel.app/api/payments/razorpay/webhook`
3. Secret: Use the value from `RAZORPAY_WEBHOOK_SECRET`
4. Enable events:
   - `payment.captured`
   - `order.paid`
   - `subscription.activated`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `subscription.cancelled`

## 4. Test Mode vs Production

### Test Mode
- Use `rzp_test_` keys (server-side only)
- PaymentsTestNotice will show automatically
- Use [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

### Production Mode
- Use `rzp_live_` keys (server-side only)
- Complete KYC verification in Razorpay
- Test with small amounts first

## 5. Deployment

### Deploy
1. Push to main branch
2. Vercel will auto-deploy
3. Check deployment logs for any errors

### Smoke Test
1. Visit `https://mahakavya.vercel.app/api/health` → Should return 200 with JSON
2. Visit `/features` → Should load without errors
3. Try intro payment flow with test card (test mode)
4. Check webhook logs in Razorpay dashboard

## 6. Local Development with Webhooks

### Setup Tunnel
\`\`\`bash
# Make script executable
chmod +x scripts/dev-webhook.sh

# Start tunnel (requires Next.js dev server running)
npm run webhook
\`\`\`

### Configure Razorpay
1. Copy tunnel URL from terminal
2. Set webhook URL to: `https://your-tunnel.loca.lt/api/payments/razorpay/webhook`
3. Use same webhook secret as production

## 7. Monitoring

### Health Check
- Endpoint: `/api/health`
- Returns: `{ ok: true, ts: "...", env: "vercel" }`

### Logs
- Vercel Functions → View logs for API routes
- Razorpay Dashboard → Webhooks → Event logs
- Supabase Dashboard → Logs

### Error Tracking
- Check Vercel function logs
- Monitor webhook delivery success in Razorpay
- Watch for failed payments in Supabase

## 8. Security Checklist

- ✅ Environment variables set correctly
- ✅ Webhook signature verification enabled
- ✅ RLS policies active in Supabase
- ✅ HTTPS enforced (automatic on Vercel)
- ✅ Security headers configured
- ✅ No secrets in client-side code

## 9. Troubleshooting

### Build Failures
- Check environment variables are set
- Verify all dependencies in package.json
- Check TypeScript errors: `npm run typecheck`

### Webhook Issues
- Verify webhook URL is accessible
- Check signature verification
- Ensure raw body parsing (not JSON)
- Check Razorpay event logs

### Payment Issues
- Verify Razorpay keys are correct (server-side)
- Check plan IDs match
- Test with Razorpay test cards
- Monitor webhook delivery

### Database Issues
- Verify RLS policies
- Check service role key permissions
- Monitor Supabase logs

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check webhook delivery in Razorpay dashboard
