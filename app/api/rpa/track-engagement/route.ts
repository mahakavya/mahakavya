import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { rpaContentService } from "@/lib/rpa-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface EngagementData {
  action: string
  timestamp: string
  page: string
  userAgent: string
  sessionId?: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EngagementData = await request.json()
    const supabase = await createSupabaseServerClient()

    // Get user session if available
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Generate session ID from IP and user agent if no user session
    const sessionId = userId || generateSessionId(request)

    // Store engagement data in database
    const { error: insertError } = await supabase.from("user_engagement_tracking").insert({
      session_id: sessionId,
      user_id: userId,
      action: body.action,
      page: body.page,
      user_agent: body.userAgent,
      ip_address: getClientIP(request),
      timestamp: body.timestamp,
      metadata: {
        referrer: request.headers.get("referer"),
        viewport: request.headers.get("viewport"),
      },
    })

    if (insertError) {
      console.error("Failed to store engagement data:", insertError)
    }

    // Process engagement data with RPA service for insights
    await processEngagementWithRPA(body, sessionId, userId)

    // Update real-time analytics
    await updateRealTimeAnalytics(body.action, body.page)

    return NextResponse.json({
      success: true,
      message: "Engagement tracked successfully",
    })
  } catch (error) {
    console.error("Engagement tracking error:", error)
    return NextResponse.json({ success: false, error: "Failed to track engagement" }, { status: 500 })
  }
}

function generateSessionId(request: NextRequest): string {
  const ip = getClientIP(request)
  const userAgent = request.headers.get("user-agent") || ""
  const timestamp = Date.now()

  return Buffer.from(`${ip}-${userAgent}-${timestamp}`).toString("base64").slice(0, 32)
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIP) {
    return realIP
  }

  return "unknown"
}

async function processEngagementWithRPA(engagement: EngagementData, sessionId: string, userId?: string) {
  try {
    // Create RPA job for engagement analysis
    const jobId = await rpaContentService.createEngagementAnalysisJob({
      sessionId,
      userId,
      action: engagement.action,
      page: engagement.page,
      timestamp: engagement.timestamp,
    })

    console.log(`Created RPA engagement analysis job: ${jobId}`)
  } catch (error) {
    console.error("RPA engagement processing error:", error)
  }
}

async function updateRealTimeAnalytics(action: string, page: string) {
  try {
    const supabase = await createSupabaseServerClient()

    // Update real-time analytics counters
    const { error } = await supabase.rpc("increment_realtime_analytics", {
      action_type: action,
      page_name: page,
      increment_value: 1,
    })

    if (error) {
      console.error("Failed to update real-time analytics:", error)
    }
  } catch (error) {
    console.error("Real-time analytics update error:", error)
  }
}
