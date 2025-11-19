import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/feed/comment", "POST", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { postId, body: commentBody } = body

    if (!postId || !commentBody?.trim()) {
      monitoring.logApiCall("/api/feed/comment", "POST", Date.now() - startTime, 400, session.user.id)
      return NextResponse.json({ error: "Post ID and comment body are required" }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        author_id: session.user.id,
        body: commentBody.trim(),
      })
      .select(`
        id,
        body,
        created_at,
        updated_at,
        author:profiles!post_comments_author_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      monitoring.logError(
        new Error(`Failed to create comment: ${error.message}`),
        { postId, commentLength: commentBody.length },
        session.user.id,
      )
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Update post comments count
    const { error: updateError } = await supabase.rpc("increment_post_comments", { post_id: postId })

    if (updateError) {
      monitoring.logError(
        new Error(`Failed to update comments count: ${updateError.message}`),
        { postId },
        session.user.id,
      )
    }

    const commentWithAuthor = {
      ...comment,
      author: {
        id: comment.author.id,
        name: comment.author.full_name || "Anonymous",
        avatar_url: comment.author.avatar_url,
      },
    }

    monitoring.logApiCall("/api/feed/comment", "POST", Date.now() - startTime, 201, session.user.id)
    monitoring.logUserAction("comment_created", { postId, commentId: comment.id }, session.user.id)

    return NextResponse.json({ comment: commentWithAuthor }, { status: 201 })
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/feed/comment" })
    monitoring.logApiCall("/api/feed/comment", "POST", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
