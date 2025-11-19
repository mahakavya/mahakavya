import { type NextRequest, NextResponse } from "next/server"

// Simple rate limiting for logging endpoint
const logRateLimit = new Map<string, { count: number; resetTime: number }>()

function checkLogRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = logRateLimit.get(ip)

  if (!limit || now > limit.resetTime) {
    logRateLimit.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }

  if (limit.count >= 10) {
    // Max 10 log requests per minute per IP
    return false
  }

  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Rate limit check
    if (!checkLogRateLimit(ip)) {
      return NextResponse.json(
        {
          success: true,
          logged: false,
          message: "Rate limited",
        },
        { status: 429 },
      )
    }

    const { userId, email, method, success, metadata } = await request.json()

    // Quick logging without blocking the response
    console.log("🔐 Signin event:", {
      userId: userId?.substring(0, 8) + "***", // Privacy-safe logging
      email: email?.substring(0, 3) + "***", // Privacy-safe logging
      method,
      success,
      timestamp: new Date().toISOString(),
      ip: ip?.substring(0, 10) + "***", // Privacy-safe IP logging
      userAgent: request.headers.get("user-agent")?.substring(0, 50) || "unknown",
    })

    // Return immediately for performance
    return NextResponse.json({
      success: true,
      logged: true,
      message: "Signin logged successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Auth logging error:", error)

    // Return success even on error to not block signin
    return NextResponse.json({
      success: true,
      logged: false,
      message: "Signin completed (logging failed)",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
