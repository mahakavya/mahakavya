import { ENV } from "./env"

// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  keyId: ENV.RAZORPAY_KEY_ID || "rzp_live_1G1FGPZa3AmNML",
  keySecret: ENV.RAZORPAY_KEY_SECRET || "r5FrLJKwv0em26kuB2SlRre5",
  webhookSecret: ENV.WEBHOOK_SECRET || "",
}

// Plan IDs
export const PLAN_ID_MONTHLY = "monthly"
export const PLAN_ID_YEARLY = "yearly"

// Currency
export const CURRENCY = "INR"

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  [PLAN_ID_MONTHLY]: {
    id: PLAN_ID_MONTHLY,
    name: "Monthly Premium",
    price: 99, // ₹99
    currency: CURRENCY,
    interval: "month",
    features: [
      "Unlimited access to all features",
      "Priority support",
      "Advanced analytics",
      "Custom themes",
      "Export data",
    ],
  },
  [PLAN_ID_YEARLY]: {
    id: PLAN_ID_YEARLY,
    name: "Yearly Premium",
    price: 999, // ₹999 (save ₹189)
    currency: CURRENCY,
    interval: "year",
    features: [
      "All monthly features",
      "2 months free",
      "Priority feature requests",
      "Dedicated account manager",
      "Advanced integrations",
    ],
  },
} as const

// Export monthly price for compatibility
export const MONTHLY_PRICE = SUBSCRIPTION_PLANS[PLAN_ID_MONTHLY].price

// Intro price (special offer)
export const INTRO_PRICE = 49 // ₹49 for first month

// Helper function to get plan by ID
export function getPlanById(planId: string) {
  return SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS] || null
}

// Payment Status
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled"

// Subscription Status
export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "expired" | "trial"

// Payment Methods
export const PAYMENT_METHODS = {
  RAZORPAY: "razorpay",
  UPI: "upi",
  CARD: "card",
  NETBANKING: "netbanking",
  WALLET: "wallet",
} as const

// Currency Configuration
export const CURRENCY_CONFIG = {
  INR: {
    symbol: "₹",
    code: "INR",
    locale: "en-IN",
  },
  USD: {
    symbol: "$",
    code: "USD",
    locale: "en-US",
  },
} as const

// Helper Functions
export function formatPrice(amount: number, currency: keyof typeof CURRENCY_CONFIG = "INR"): string {
  const config = CURRENCY_CONFIG[currency]
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function isTestMode(): boolean {
  return ENV.NODE_ENV === "development" || RAZORPAY_CONFIG.keyId.startsWith("rzp_test_")
}

export function getRazorpayOptions(orderId: string, amount: number, userEmail?: string, userName?: string) {
  return {
    key: RAZORPAY_CONFIG.keyId,
    amount: amount * 100, // Convert to paise
    currency: CURRENCY,
    name: "Mahakavya",
    description: "Premium Subscription",
    order_id: orderId,
    prefill: {
      email: userEmail,
      name: userName,
    },
    theme: {
      color: "#6366f1",
    },
    modal: {
      ondismiss: () => {
        console.log("Payment modal dismissed")
      },
    },
  }
}

// Webhook Event Types
export const WEBHOOK_EVENTS = {
  PAYMENT_AUTHORIZED: "payment.authorized",
  PAYMENT_CAPTURED: "payment.captured",
  PAYMENT_FAILED: "payment.failed",
  ORDER_PAID: "order.paid",
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
} as const

// Export types
export type WebhookEvent = keyof typeof WEBHOOK_EVENTS
export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS]

// Validation
export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 500000 // Max ₹5,00,000
}

export function validateSubscriptionPlan(planId: string): planId is keyof typeof SUBSCRIPTION_PLANS {
  return planId in SUBSCRIPTION_PLANS
}

// Default exports for compatibility
export default {
  RAZORPAY_CONFIG,
  SUBSCRIPTION_PLANS,
  MONTHLY_PRICE,
  INTRO_PRICE,
  PLAN_ID_MONTHLY,
  PLAN_ID_YEARLY,
  CURRENCY,
  formatPrice,
  isTestMode,
  getRazorpayOptions,
  getPlanById,
}
