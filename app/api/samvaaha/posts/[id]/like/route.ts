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

    const postId = params.id

    // Check if post exists and is viewable
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, author_id")
      .eq("id", postId)
      .single()

    if (postError) {
      if (postError.code === "PGRST116") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }

    // Check if user already liked the post
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (likeCheckError && likeCheckError.code !== "PGRST116") {
      console.error("Error checking existing like:", likeCheckError)
      return NextResponse.json({ error: "Failed to check like status" }, { status: 500 })
    }

    let liked = false

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error removing like:", deleteError)
        return NextResponse.json({ error: "Failed to remove like" }, { status: 500 })
      }

      liked = false
    } else {
      // Like the post
      const { error: insertError } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Error adding like:", insertError)
        return NextResponse.json({ error: "Failed to add like" }, { status: 500 })
      }

      liked = true
    }

    // Get updated like count
    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .select("like_count")
      .eq("id", postId)
      .single()

    if (updateError) {
      console.error("Error fetching updated post:", updateError)
      return NextResponse.json({ error: "Failed to fetch updated post" }, { status: 500 })
    }

    return NextResponse.json(
      {
        liked,
        likeCount: updatedPost.like_count,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult.remaining - 1, rateLimitResult.resetTime, 100),
      },
    )
  } catch (error) {
    console.error("Error in POST /api/samvaaha/posts/[id]/like:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
