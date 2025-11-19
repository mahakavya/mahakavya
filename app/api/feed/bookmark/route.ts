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

    const { postId, bookmarked } = await request.json()

    if (bookmarked) {
      // Add bookmark
      await supabase.from("bookmarks").upsert({
        user_id: profile.id,
        post_id: postId,
        created_at: new Date().toISOString(),
      })
    } else {
      // Remove bookmark
      await supabase.from("bookmarks").delete().eq("user_id", profile.id).eq("post_id", postId)
    }

    return NextResponse.json({ success: true, bookmarked })
  } catch (error) {
    console.error("Bookmark error:", error)
    return NextResponse.json({ error: "Failed to bookmark post" }, { status: 500 })
  }
}
