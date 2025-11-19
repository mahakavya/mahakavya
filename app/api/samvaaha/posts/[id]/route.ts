import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — force dynamic to avoid prerender
export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const postId = params.id

    // Fetch post with author and viewer interactions
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(`
        *,
        author:user_profiles!posts_author_id_fkey(id, display_name, avatar_url),
        post_likes!left(user_id),
        bookmarks!left(user_id)
      `)
      .eq("id", postId)
      .single()

    if (postError) {
      if (postError.code === "PGRST116") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      console.error("Error fetching post:", postError)
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }

    // Fetch comments with pagination
    const { searchParams } = new URL(request.url)
    const commentLimit = Math.min(Number.parseInt(searchParams.get("commentLimit") || "20"), 50)

    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        *,
        author:user_profiles!comments_author_id_fkey(id, display_name, avatar_url),
        comment_likes!left(user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(commentLimit)

    if (commentsError) {
      console.error("Error fetching comments:", commentsError)
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    // Process post and comments to add viewer interaction flags
    const processedPost = {
      ...post,
      viewerHasLiked: post.post_likes?.some((like: any) => like.user_id === user.id) || false,
      viewerBookmarked: post.bookmarks?.some((bookmark: any) => bookmark.user_id === user.id) || false,
      post_likes: undefined,
      bookmarks: undefined,
    }

    const processedComments = comments.map((comment) => ({
      ...comment,
      viewerHasLiked: comment.comment_likes?.some((like: any) => like.user_id === user.id) || false,
      comment_likes: undefined,
    }))

    return NextResponse.json({
      post: processedPost,
      comments: processedComments,
    })
  } catch (error) {
    console.error("Error in GET /api/samvaaha/posts/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
