#!/usr/bin/env bash

echo "🚀 Starting webhook tunnel for Mahakavya development..."

# Check if port 3000 is available
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Next.js dev server not running on port 3000"
    echo "   Please start it with: npm run dev"
    exit 1
fi

echo "📡 Setting up tunnel..."

# Option A: ngrok (requires account for custom subdomain)
if command -v ngrok &> /dev/null; then
    echo "🔗 Using ngrok..."
    ngrok http --host-header=rewrite 3000
else
    # Option B: localtunnel (no account needed)
    echo "🔗 Using localtunnel..."
    npx localtunnel --port 3000 --subdomain mahakavya-local || npx localtunnel --port 3000
fi

echo ""
echo "📋 Next steps:"
echo "1. Copy the tunnel URL from above"
echo "2. Go to Razorpay Dashboard → Webhooks"
echo "3. Set webhook URL to: https://<your-tunnel-domain>/api/payments/razorpay/webhook"
echo "4. Use the secret from your RAZORPAY_WEBHOOK_SECRET env var"
echo "5. Enable events: payment.captured, subscription.activated, invoice.paid, etc."
