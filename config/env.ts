// Environment configuration with validation
export interface EnvConfig {
  NODE_ENV: string
  NEXT_PUBLIC_SUPABASE_URL: string
  SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  SERVICE_ROLE_KEY?: string
  NEXT_PUBLIC_ANALYTICS_ID?: string
  ENABLE_MONITORING?: boolean
  RAZORPAY_KEY_ID?: string
  RAZORPAY_KEY_SECRET?: string
  WEBHOOK_SECRET?: string
  OPENAI_API_KEY?: string
  RESEND_API_KEY?: string
  POSTGRES_URL?: string
  POSTGRES_USER?: string
  POSTGRES_HOST?: string
  POSTGRES_PASSWORD?: string
  POSTGRES_DATABASE?: string
  POSTGRES_PRISMA_URL?: string
  SUPABASE_JWT_SECRET?: string
  SENTRY_DSN?: string
  SENTRY_AUTH_TOKEN?: string
}

// Get environment variables with safe defaults
function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window !== "undefined") {
    // Client-side: only access NEXT_PUBLIC_ variables
    if (key.startsWith("NEXT_PUBLIC_")) {
      return (window as any).__ENV__?.[key] || process.env[key] || defaultValue || ""
    }
    return defaultValue || ""
  }

  // Server-side: access all environment variables
  return process.env[key] || defaultValue || ""
}

export const ENV: EnvConfig = {
  NODE_ENV: getEnvVar("NODE_ENV", "development"),
  NEXT_PUBLIC_SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_URL: getEnvVar("SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_ANON_KEY: getEnvVar("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  SERVICE_ROLE_KEY: getEnvVar("SERVICE_ROLE_KEY") || getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
  NEXT_PUBLIC_ANALYTICS_ID: getEnvVar("NEXT_PUBLIC_ANALYTICS_ID"),
  ENABLE_MONITORING: getEnvVar("ENABLE_MONITORING", "true") === "true",
  RAZORPAY_KEY_ID: getEnvVar("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: getEnvVar("RAZORPAY_KEY_SECRET"),
  WEBHOOK_SECRET: getEnvVar("WEBHOOK_SECRET"),
  OPENAI_API_KEY: getEnvVar("OPENAI_API_KEY"),
  RESEND_API_KEY: getEnvVar("RESEND_API_KEY"),
  POSTGRES_URL: getEnvVar("POSTGRES_URL"),
  POSTGRES_USER: getEnvVar("POSTGRES_USER"),
  POSTGRES_HOST: getEnvVar("POSTGRES_HOST"),
  POSTGRES_PASSWORD: getEnvVar("POSTGRES_PASSWORD"),
  POSTGRES_DATABASE: getEnvVar("POSTGRES_DATABASE"),
  POSTGRES_PRISMA_URL: getEnvVar("POSTGRES_PRISMA_URL"),
  SUPABASE_JWT_SECRET: getEnvVar("SUPABASE_JWT_SECRET"),
  SENTRY_DSN: getEnvVar("SENTRY_DSN"),
  SENTRY_AUTH_TOKEN: getEnvVar("SENTRY_AUTH_TOKEN"),
}

// Validation function
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  const missing = required.filter((key) => {
    if (key === "NEXT_PUBLIC_SUPABASE_URL") return !(ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL)
    if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") return !(ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY)
    if (key === "SUPABASE_SERVICE_ROLE_KEY") return !(ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SERVICE_ROLE_KEY)
    return !ENV[key as keyof EnvConfig]
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Helper to check if we're in production
export const isProduction = ENV.NODE_ENV === "production"
export const isDevelopment = ENV.NODE_ENV === "development"

// Export individual environment variables for convenience
export const {
  NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_ANALYTICS_ID,
  ENABLE_MONITORING,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  WEBHOOK_SECRET,
  OPENAI_API_KEY,
  RESEND_API_KEY,
  POSTGRES_URL,
  POSTGRES_USER,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  POSTGRES_PRISMA_URL,
  SUPABASE_JWT_SECRET,
  SENTRY_DSN,
  SENTRY_AUTH_TOKEN,
} = ENV

// Convenience exports used across the codebase
export const env = ENV

export function assertServerEnv() {
  if (typeof window !== "undefined") return
  // Ensure critical server-side vars exist
  const missing: string[] = []
  if (!ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY")
  if (missing.length > 0) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`)
  }
}

export const isDemoMode = process.env.DEMO === "true" || ENV.NODE_ENV === "demo"

export function hasRazorpayConfig() {
  return Boolean(ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET)
}

export function hasSupabaseConfig() {
  return Boolean(
    (ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL) && (ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY),
  )
}

export function getRazorpayPublicKey() {
  if (!ENV.RAZORPAY_KEY_ID) {
    throw new Error("Razorpay key ID not configured. Please set RAZORPAY_KEY_ID environment variable.")
  }
  return ENV.RAZORPAY_KEY_ID
}

export function isRazorpayTestMode(): boolean {
  const keyId = ENV.RAZORPAY_KEY_ID || ""
  return keyId.startsWith("rzp_test_") || ENV.NODE_ENV === "development"
}

// Supabase Configuration (legacy exports for compatibility)
export const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL || ""
export const SUPABASE_ANON_KEY = ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY || ENV.SUPABASE_ANON_KEY || ""

// App Configuration
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// AI Service Configuration
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || ""
export const AI_MODERATION_URL = process.env.AI_MODERATION_URL || ""

// Blockchain Configuration
export const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY || ""

// Feature Flags
export const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS === "true"
export const ENABLE_PUSH_NOTIFICATIONS = process.env.ENABLE_PUSH_NOTIFICATIONS === "true"
export const ENABLE_BLOCKCHAIN = process.env.ENABLE_BLOCKCHAIN === "true"

// Rate Limiting
export const RATE_LIMIT_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_REQUESTS || "100")
export const RATE_LIMIT_WINDOW = Number.parseInt(process.env.RATE_LIMIT_WINDOW || "900") // 15 minutes

// File Upload Limits
export const MAX_FILE_SIZE = Number.parseInt(process.env.MAX_FILE_SIZE || "10485760") // 10MB
export const MAX_REEL_DURATION = Number.parseInt(process.env.NEXT_PUBLIC_MAX_REEL_DURATION_SECONDS || "60")

// Database Configuration
export const DATABASE_URL = process.env.DATABASE_URL || ""

// Helper Functions
export function getAppUrl(): string {
  if (isProduction) {
    return APP_URL
  }
  return "http://localhost:3000"
}

// Validation Functions
export function validateRequiredEnvVars(): void {
  const required = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", value: SUPABASE_URL },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: SUPABASE_ANON_KEY },
  ]

  const missing = required.filter(({ value }) => !value)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.map(({ name }) => name).join(", ")}`)
  }
}

export function assertClientEnv(): void {
  if (typeof window === "undefined") {
    throw new Error("This function can only be called on the client side")
  }
}

// Environment Info
export const ENV_INFO = {
  NODE_ENV,
  isDevelopment,
  isProduction,
  isTest: ENV.NODE_ENV === "test",
  hasSupabase: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
  hasRazorpay: !!(ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET),
  hasAI: !!AI_SERVICE_URL,
  hasBlockchain: !!BLOCKCHAIN_API_KEY,
  hasSentry: !!ENV.SENTRY_DSN,
  isRazorpayTestMode: isRazorpayTestMode(),
} as const

// Export for debugging
export function getEnvInfo() {
  return ENV_INFO
}
