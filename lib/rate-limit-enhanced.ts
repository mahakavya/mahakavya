import { createClient } from "./supabase/server"

interface RateLimitConfig {
  key: string
  limit: number
  window: number // in seconds
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

// Comprehensive rate limits for all endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication
  auth_login: { key: "auth:login", limit: 5, window: 300 }, // 5 attempts per 5 minutes
  auth_signup: { key: "auth:signup", limit: 3, window: 3600 }, // 3 attempts per hour
  auth_reset: { key: "auth:reset", limit: 3, window: 3600 }, // 3 attempts per hour

  // Content creation
  create_post: { key: "posts:create", limit: 10, window: 60 }, // 10 posts per minute
  create_comment: { key: "comments:create", limit: 30, window: 60 }, // 30 comments per minute
  create_reel: { key: "reels:create", limit: 5, window: 300 }, // 5 reels per 5 minutes
  create_campaign: { key: "campaigns:create", limit: 3, window: 3600 }, // 3 campaigns per hour

  // Social interactions
  toggle_like: { key: "likes:toggle", limit: 100, window: 60 }, // 100 likes per minute
  follow_user: { key: "follows:create", limit: 50, window: 60 }, // 50 follows per minute

  // Reporting & flagging
  create_report: { key: "reports:create", limit: 10, window: 3600 }, // 10 reports per hour
  create_flag: { key: "flags:create", limit: 5, window: 60 }, // 5 flags per minute

  // Messaging
  send_message: { key: "messages:send", limit: 60, window: 60 }, // 60 messages per minute

  // Payments & transactions
  create_payment: { key: "payments:create", limit: 10, window: 60 }, // 10 payments per minute
  create_donation: { key: "donations:create", limit: 5, window: 300 }, // 5 donations per 5 minutes

  // API requests
  api_general: { key: "api:general", limit: 100, window: 60 }, // 100 requests per minute
  api_search: { key: "api:search", limit: 30, window: 60 }, // 30 searches per minute
  api_upload: { key: "api:upload", limit: 10, window: 300 }, // 10 uploads per 5 minutes

  // Admin operations
  admin_action: { key: "admin:action", limit: 100, window: 60 }, // 100 admin actions per minute
  admin_bulk: { key: "admin:bulk", limit: 5, window: 300 }, // 5 bulk operations per 5 minutes
}

export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS,
  customKey?: string,
): Promise<{ allowed: boolean; remaining: number; resetTime: number; limit: number }> {
  const rateLimit = RATE_LIMITS[action]
  if (!rateLimit) {
    return { allowed: true, remaining: 100, resetTime: Date.now() + 60000, limit: 100 }
  }

  const key = customKey || `${userId}:${rateLimit.key}`
  const now = Date.now()
  const windowMs = rateLimit.window * 1000

  let record = rateLimitStore.get(key)

  // Initialize or reset if window expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, record)
  }

  // Increment count
  record.count++

  const allowed = record.count <= rateLimit.limit
  const remaining = Math.max(0, rateLimit.limit - record.count)

  // Log rate limit events to database for monitoring
  if (!allowed) {
    try {
      const supabase = await createClient()
      await supabase.from("rate_events").insert({
        user_id: userId,
        route: action,
        ip: "server",
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to log rate limit event:", error)
    }
  }

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
    limit: rateLimit.limit,
  }
}

export async function checkIPRateLimit(
  ip: string,
  action: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; remaining: number; resetTime: number; limit: number }> {
  return checkRateLimit(ip, action, `ip:${ip}:${RATE_LIMITS[action].key}`)
}

export function getRateLimitHeaders(remaining: number, resetTime: number, limit: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
  }
}

export function rateLimitResponse(resetTime: number, limit: number) {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
      },
    },
  )
}
