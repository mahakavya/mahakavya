import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reelId = params.id

    // Check if view already recorded in the last hour (to prevent spam)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: recentView } = await supabase
      .from("reel_views")
      .select("id")
      .eq("reel_id", reelId)
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo)
      .single()

    if (recentView) {
      // View already recorded recently
      return NextResponse.json({ success: true, message: "View already recorded" })
    }

    // Record the view
    const { error: insertError } = await supabase.from("reel_views").insert({
      reel_id: reelId,
      user_id: user.id,
    })

    if (insertError) {
      console.error("Failed to record view:", insertError)
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
    }

    // Increment views count
    const { error: updateError } = await supabase.rpc("increment_reel_views", {
      reel_id: reelId,
    })

    if (updateError) {
      console.error("Failed to update views count:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View ping error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
