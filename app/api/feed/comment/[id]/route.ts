import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall(`/api/feed/comment/${params.id}`, "DELETE", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const commentId = params.id

    // Check if comment exists and belongs to user
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("id, post_id, author_id")
      .eq("id", commentId)
      .single()

    if (fetchError || !comment) {
      monitoring.logApiCall(`/api/feed/comment/${params.id}`, "DELETE", Date.now() - startTime, 404, session.user.id)
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    if (comment.author_id !== session.user.id) {
      monitoring.logApiCall(`/api/feed/comment/${params.id}`, "DELETE", Date.now() - startTime, 403, session.user.id)
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 })
    }

    const { error: deleteError } = await supabase.from("post_comments").delete().eq("id", commentId)

    if (deleteError) {
      monitoring.logError(new Error(`Failed to delete comment: ${deleteError.message}`), { commentId }, session.user.id)
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
    }

    // Update post comments count
    const { error: updateError } = await supabase.rpc("decrement_post_comments", { post_id: comment.post_id })

    if (updateError) {
      monitoring.logError(
        new Error(`Failed to update comments count: ${updateError.message}`),
        { postId: comment.post_id },
        session.user.id,
      )
    }

    monitoring.logApiCall(`/api/feed/comment/${params.id}`, "DELETE", Date.now() - startTime, 200, session.user.id)
    monitoring.logUserAction("comment_deleted", { commentId, postId: comment.post_id }, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: `/api/feed/comment/${params.id}` })
    monitoring.logApiCall(`/api/feed/comment/${params.id}`, "DELETE", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
