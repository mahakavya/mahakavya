import { type NextRequest, NextResponse } from "next/server"
import { liveStreamingService } from "@/lib/live-streaming"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const streams = await liveStreamingService.getActiveStreams(limit)

    return NextResponse.json({
      streams,
      count: streams.length,
    })
  } catch (error) {
    console.error("Get streams error:", error)
    return NextResponse.json({ error: "Failed to fetch streams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, scheduledFor, chatEnabled } = await request.json()

    const stream = await liveStreamingService.createStream({
      title,
      description,
      streamerId: profile.user_id,
      scheduledFor,
      chatEnabled,
    })

    return NextResponse.json({ stream })
  } catch (error) {
    console.error("Create stream error:", error)
    return NextResponse.json({ error: "Failed to create stream" }, { status: 500 })
  }
}
