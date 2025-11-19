import { type NextRequest, NextResponse } from "next/server"

// This route reads request.headers to detect client IP — mark as dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get client IP from various headers
    const forwarded = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const cfConnectingIp = request.headers.get("cf-connecting-ip")

    const ip = cfConnectingIp || realIp || forwarded?.split(",")[0] || "127.0.0.1"

    return NextResponse.json({
      success: true,
      ip: ip.trim(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Get IP error:", error)

    return NextResponse.json({
      success: true,
      ip: "127.0.0.1",
      timestamp: new Date().toISOString(),
      warning: "IP detection failed, using fallback",
    })
  }
}
