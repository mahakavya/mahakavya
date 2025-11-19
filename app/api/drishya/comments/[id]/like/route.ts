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

    const commentId = params.id

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from("reel_comments")
      .select("id")
      .eq("id", commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Toggle like
    const { data: existingLike, error: checkError } = await supabase
      .from("reel_comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    let isLiked = false

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await supabase
        .from("reel_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id)

      if (deleteError) {
        return NextResponse.json({ error: "Failed to unlike comment" }, { status: 500 })
      }
      isLiked = false
    } else {
      // Like
      const { error: insertError } = await supabase.from("reel_comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      })

      if (insertError) {
        return NextResponse.json({ error: "Failed to like comment" }, { status: 500 })
      }
      isLiked = true
    }

    // Get updated like count
    const { data: updatedComment, error: countError } = await supabase
      .from("reel_comments")
      .select("like_count")
      .eq("id", commentId)
      .single()

    if (countError) {
      return NextResponse.json({ error: "Failed to get updated count" }, { status: 500 })
    }

    return NextResponse.json({
      isLiked,
      likeCount: updatedComment.like_count,
    })
  } catch (error) {
    console.error("Toggle comment like error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
