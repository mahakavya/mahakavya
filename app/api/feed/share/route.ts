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

    const { postId } = await request.json()

    // Increment shares count
    const { data: post } = await supabase.from("posts").select("shares_count, user_id").eq("id", postId).single()

    if (post) {
      const newCount = (post.shares_count || 0) + 1

      await supabase.from("posts").update({ shares_count: newCount }).eq("id", postId)

      // Log share activity
      await supabase.from("analytics_events").insert({
        user_id: profile.id,
        event_type: "post_shared",
        event_data: {
          post_id: postId,
          shared_at: new Date().toISOString(),
        },
      })

      // Create notification for post author
      if (post.user_id !== profile.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          kind: "share",
          title: "Post Shared",
          body: `${profile.full_name || profile.email} shared your post`,
          href: `/samvaaha/post/${postId}`,
          read: false,
          created_at: new Date().toISOString(),
        })
      }

      return NextResponse.json({ success: true, count: newCount })
    }

    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json({ error: "Failed to share post" }, { status: 500 })
  }
}
