import { describe, it, expect, beforeEach, vi } from "vitest"
import { checkRateLimit, type RateLimitConfig } from "../rate-limit-enhanced"

describe("Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should allow requests within rate limit", async () => {
    const config: RateLimitConfig = {
      identifier: "test-user",
      limit: 10,
      window: 60,
    }

    const result = await checkRateLimit(config)
    expect(result.success).toBe(true)
    expect(result.remaining).toBeLessThanOrEqual(10)
  })

  it("should block requests exceeding rate limit", async () => {
    const config: RateLimitConfig = {
      identifier: "test-user-2",
      limit: 1,
      window: 60,
    }

    // First request should succeed
    const first = await checkRateLimit(config)
    expect(first.success).toBe(true)

    // Second request should be rate limited
    const second = await checkRateLimit(config)
    expect(second.success).toBe(false)
    expect(second.remaining).toBe(0)
  })

  it("should have different limits for different identifiers", async () => {
    const config1: RateLimitConfig = {
      identifier: "user-1",
      limit: 5,
      window: 60,
    }

    const config2: RateLimitConfig = {
      identifier: "user-2",
      limit: 5,
      window: 60,
    }

    const result1 = await checkRateLimit(config1)
    const result2 = await checkRateLimit(config2)

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })
})
