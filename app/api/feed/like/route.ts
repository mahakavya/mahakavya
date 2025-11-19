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

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", profile.id)
      .single()

    let liked = false
    let newCount = 0

    if (existingLike) {
      // Unlike the post
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile.id)

      // Decrement likes count
      const { data: post } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

      newCount = Math.max(0, (post?.likes_count || 1) - 1)

      await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId)

      liked = false
    } else {
      // Like the post
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: profile.id,
        created_at: new Date().toISOString(),
      })

      // Increment likes count
      const { data: post } = await supabase.from("posts").select("likes_count").eq("id", postId).single()

      newCount = (post?.likes_count || 0) + 1

      await supabase.from("posts").update({ likes_count: newCount }).eq("id", postId)

      liked = true

      // Create notification for post author
      const { data: postData } = await supabase.from("posts").select("user_id").eq("id", postId).single()

      if (postData && postData.user_id !== profile.id) {
        await supabase.from("notifications").insert({
          user_id: postData.user_id,
          kind: "like",
          title: "New Like",
          body: `${profile.full_name || profile.email} liked your post`,
          href: `/samvaaha/post/${postId}`,
          read: false,
          created_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({ liked, count: newCount })
  } catch (error) {
    console.error("Like error:", error)
    return NextResponse.json({ error: "Failed to like post" }, { status: 500 })
  }
}
