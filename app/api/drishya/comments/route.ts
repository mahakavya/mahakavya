import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const createCommentSchema = z.object({
  reelId: z.string().uuid(),
  body: z.string().min(1).max(500),
})

const getCommentsSchema = z.object({
  reelId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { reelId, body: commentBody } = createCommentSchema.parse(body)

    // Check if reel exists and user can view it
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("id, author_id, visibility")
      .eq("id", reelId)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from("reel_comments")
      .insert({
        reel_id: reelId,
        author_id: user.id,
        body: commentBody,
      })
      .select(`
        *,
        author:user_profiles!author_id(
          id,
          display_name,
          avatar_url,
          username
        )
      `)
      .single()

    if (commentError) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const { reelId, limit, cursor } = getCommentsSchema.parse({
      reelId: searchParams.get("reelId"),
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
    })

    // Build query
    let query = supabase
      .from("reel_comments")
      .select(`
        *,
        author:user_profiles!author_id(
          id,
          display_name,
          avatar_url,
          username
        ),
        is_liked:reel_comment_likes!inner(user_id)
      `)
      .eq("reel_id", reelId)
      .eq("reel_comment_likes.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data: comments, error: commentsError } = await query

    if (commentsError) {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    const nextCursor = comments.length === limit ? comments[comments.length - 1]?.created_at : null

    return NextResponse.json({
      comments,
      nextCursor,
      hasMore: comments.length === limit,
    })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
