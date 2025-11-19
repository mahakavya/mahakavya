import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, "toggle_like")
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 100),
        },
      )
    }

    const commentId = params.id

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("id, post_id")
      .eq("id", commentId)
      .single()

    if (commentError) {
      if (commentError.code === "PGRST116") {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 })
    }

    // Check if user already liked the comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (likeCheckError && likeCheckError.code !== "PGRST116") {
      console.error("Error checking existing comment like:", likeCheckError)
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
    }

    let liked = false

    if (existingLike) {
      // Unlike the comment
      const { error: deleteError } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error removing comment like:", deleteError)
        return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
      }

      liked = false
    } else {
      // Like the comment
      const { error: insertError } = await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Error adding comment like:", insertError)
        return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
      }

      liked = true
    }

    // Get updated like count
    const { data: updatedComment, error: updateError } = await supabase
      .from("comments")
      .select("like_count")
      .eq("id", commentId)
      .single()

    if (updateError) {
      console.error("Error fetching updated comment:", updateError)
      return NextResponse.json({ error: "Failed to fetch updated comment" }, { status: 500 })
    }

    return NextResponse.json(
      {
        liked,
        likeCount: updatedComment.like_count,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult.remaining - 1, rateLimitResult.resetTime, 100),
      },
    )
  } catch (error) {
    console.error("Error in POST /api/samvaaha/comments/[id]/like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
