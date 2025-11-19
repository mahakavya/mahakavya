import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId, reason } = await request.json()

    // Create report
    await supabase.from("reports").insert({
      entity_type: "post",
      entity_id: postId,
      reporter_id: profile.id,
      reason,
      status: "open",
      created_at: new Date().toISOString(),
    })

    // Log the report for admin review
    await supabase.from("analytics_events").insert({
      user_id: profile.id,
      event_type: "content_reported",
      event_data: {
        post_id: postId,
        reason,
        reported_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Report error:", error)
    return NextResponse.json({ error: "Failed to report post" }, { status: 500 })
  }
}
