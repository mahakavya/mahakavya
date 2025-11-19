import { createClient } from "./supabase/server"

interface RateLimit {
  key: string
  limit: number
  window: number // in seconds
}

const RATE_LIMITS: Record<string, RateLimit> = {
  create_post: { key: "posts", limit: 10, window: 60 }, // 10 posts per minute
  create_comment: { key: "comments", limit: 30, window: 60 }, // 30 comments per minute
  create_flag: { key: "flags", limit: 5, window: 60 }, // 5 flags per minute
  toggle_like: { key: "likes", limit: 100, window: 60 }, // 100 likes per minute
}

export async function checkRateLimit(
  userId: string,
  action: keyof typeof RATE_LIMITS,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const rateLimit = RATE_LIMITS[action]
  if (!rateLimit) {
    return { allowed: true, remaining: rateLimit?.limit || 0, resetTime: 0 }
  }

  const supabase = await createClient()
  const windowStart = new Date(Date.now() - rateLimit.window * 1000)

  // For simplicity, we'll use a basic count check
  // In production, consider using Redis or a dedicated rate limiting service

  try {
    // This is a simplified rate limiting approach
    // You might want to create a dedicated rate_limits table for better tracking
    const key = `${userId}:${action}`
    const now = Date.now()
    const windowStartTime = now - rateLimit.window * 1000

    // For now, we'll allow all requests and log for monitoring
    // In production, implement proper rate limiting with Redis or database
    console.log(`Rate limit check for ${key}: ${rateLimit.limit}/${rateLimit.window}s`)

    return {
      allowed: true,
      remaining: rateLimit.limit,
      resetTime: now + rateLimit.window * 1000,
    }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // Fail open - allow the request if rate limiting fails
    return { allowed: true, remaining: 0, resetTime: 0 }
  }
}

export function getRateLimitHeaders(remaining: number, resetTime: number, limit: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
  }
}
