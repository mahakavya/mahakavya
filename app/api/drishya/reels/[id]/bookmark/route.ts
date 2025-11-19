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

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from("reel_bookmarks")
      .select("id")
      .eq("reel_id", reelId)
      .eq("user_id", user.id)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("reel_bookmarks")
        .delete()
        .eq("reel_id", reelId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Failed to remove bookmark:", deleteError)
        return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: false })
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("reel_bookmarks").insert({
        reel_id: reelId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Failed to bookmark reel:", insertError)
        return NextResponse.json({ error: "Failed to bookmark reel" }, { status: 500 })
      }

      return NextResponse.json({ bookmarked: true })
    }
  } catch (error) {
    console.error("Bookmark toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
