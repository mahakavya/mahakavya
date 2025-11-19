import { type NextRequest, NextResponse } from "next/server"
import { getServerUser, createServerClient } from "@/lib/supabase-server"
// Uses request.url — ensure route is dynamic to prevent static prerender
export const dynamic = 'force-dynamic'
import { checkAccess } from "@/lib/access"

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!checkAccess(user, "canRead")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50)
    const offset = (page - 1) * limit

  const supabase = createServerClient() as any

    // Get posts with author information
    const { data: posts, error } = await (supabase
      .from("samvaaha_posts") as any)
      .select(`
        *,
        profiles:author_id (
          id,
          display_name,
          avatar_url,
          username
        ),
        samvaaha_likes!left (
          user_id
        ),
        samvaaha_bookmarks!left (
          user_id
        )
      `)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Transform the data to include user interaction status
    const transformedPosts = (posts || []).map((post: any) => ({
      ...post,
      isLiked: user ? ((post.samvaaha_likes as any[]) || []).some((like: any) => like.user_id === user.id) : false,
      isBookmarked: user ? ((post.samvaaha_bookmarks as any[]) || []).some((bookmark: any) => bookmark.user_id === user.id) : false,
      author: post.profiles,
    })) || []

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts?.length === limit,
      },
    })
  } catch (error) {
    console.error("Feed API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser()

    if (!checkAccess(user, "canWrite")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { content, media_urls, visibility = "public" } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "Content too long" }, { status: 400 })
    }

  const supabase = createServerClient() as any

    const { data: post, error } = await (supabase
      .from("samvaaha_posts") as any)
      .insert({
        author_id: user!.id,
        content: content.trim(),
        media_urls: media_urls || [],
        visibility,
      })
      .select(`
        *,
        profiles:author_id (
          id,
          display_name,
          avatar_url,
          username
        )
      `)
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    return NextResponse.json(
      {
        post: {
          ...post,
          isLiked: false,
          isBookmarked: false,
          author: post.profiles,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Post creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
