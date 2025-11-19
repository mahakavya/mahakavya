#!/usr/bin/env node

import { config } from "dotenv"
import Razorpay from "razorpay"

// Load environment variables
config()

const REQUIRED_ENV_VARS = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
]

// Check required environment variables
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

async function createPlans() {
  console.log("🚀 Setting up Razorpay plans...")

  try {
    // Create monthly subscription plan
    const monthlyPlan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "Mahakavya Monthly Subscription",
        amount: 49900, // ₹499 in paise
        currency: "INR",
        description: "Monthly access to all Mahakavya features",
      },
      notes: {
        plan_type: "monthly",
        features: "feed,reels,chat,fundraising,draws,sahaya",
      },
    })

    console.log("✅ Monthly plan created:", monthlyPlan.id)

    // Create yearly subscription plan (with discount)
    const yearlyPlan = await razorpay.plans.create({
      period: "yearly",
      interval: 1,
      item: {
        name: "Mahakavya Yearly Subscription",
        amount: 499900, // ₹4999 in paise (2 months free)
        currency: "INR",
        description: "Yearly access to all Mahakavya features (2 months free)",
      },
      notes: {
        plan_type: "yearly",
        features: "feed,reels,chat,fundraising,draws,sahaya",
        discount: "2_months_free",
      },
    })

    console.log("✅ Yearly plan created:", yearlyPlan.id)

    console.log("\n📋 Plan Summary:")
    console.log(`Monthly Plan ID: ${monthlyPlan.id}`)
    console.log(`Yearly Plan ID: ${yearlyPlan.id}`)
    
    console.log("\n🔧 Update your config/payments.ts with these plan IDs:")
    console.log(`export const PLAN_ID_MONTHLY = "${monthlyPlan.id}"`)
    console.log(`export const PLAN_ID_YEARLY = "${yearlyPlan.id}"`)

  } catch (error) {
    console.error("❌ Error creating plans:", error.message)
    
    if (error.statusCode === 400 && error.error?.description?.includes("already exists")) {
      console.log("ℹ️  Plans might already exist. Check your Razorpay dashboard.")
    }
    
    process.exit(1)
  }
}

async function setupWebhooks() {
  console.log("\n🔗 Webhook Setup Instructions:")
  console.log("1. Go to your Razorpay Dashboard")
  console.log("2. Navigate to Settings > Webhooks")
  console.log("3. Create a new webhook with these settings:")
  console.log(`   URL: ${process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com"}/api/payments/razorpay/webhook`)
  console.log("   Events: payment.authorized, payment.captured, payment.failed, subscription.activated, subscription.charged, subscription.cancelled")
  console.log(`   Secret: ${process.env.RAZORPAY_WEBHOOK_SECRET || "your-webhook-secret"}`)
}

async function main() {
  console.log("🎯 Mahakavya Razorpay Setup")
  console.log("=" .repeat(50))
  
  await createPlans()
  await setupWebhooks()
  
  console.log("\n✨ Setup completed successfully!")
  console.log("🔐 Remember to update your environment variables with the plan IDs")
}

main().catch((error) => {
  console.error("❌ Setup failed:", error)
  process.exit(1)
})
