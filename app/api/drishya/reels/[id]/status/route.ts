import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get reel status
    const { data: reel, error } = await supabase
      .from("reels")
      .select("status, processing_progress")
      .eq("id", reelId)
      .eq("author_id", user.id)
      .single()

    if (error || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    return NextResponse.json({
      status: reel.status,
      progress: reel.processing_progress || 0,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
