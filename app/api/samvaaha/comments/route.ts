import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { sanitizeText } from "@/lib/sanitize"
import { z } from "zod"

const createCommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
})

export async function POST(request: NextRequest) {
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
    const rateLimitResult = await checkRateLimit(user.id, "create_comment")
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult.remaining, rateLimitResult.resetTime, 30),
        },
      )
    }

    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)

    // Check if post exists and is viewable
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id")
      .eq("id", validatedData.post_id)
      .single()

    if (postError) {
      if (postError.code === "PGRST116") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }

    // Sanitize comment body
    const sanitizedBody = sanitizeText(validatedData.body)

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: validatedData.post_id,
        author_id: user.id,
        body: sanitizedBody,
      })
      .select(`
        *,
        author:user_profiles!comments_author_id_fkey(id, display_name, avatar_url)
      `)
      .single()

    if (commentError) {
      console.error("Error creating comment:", commentError)
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    const processedComment = {
      ...comment,
      viewerHasLiked: false,
    }

    return NextResponse.json(
      {
        comment: processedComment,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult.remaining - 1, rateLimitResult.resetTime, 30),
      },
    )
  } catch (error) {
    console.error("Error in POST /api/samvaaha/comments:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
