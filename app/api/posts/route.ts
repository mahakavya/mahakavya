import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — force dynamic to avoid static prerender calling request APIs
export const dynamic = 'force-dynamic'
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
  const supabase = createSupabaseServerClient()
    const sb: any = supabase as any
    const { searchParams } = new URL(request.url)

    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)
    const cursor = searchParams.get("cursor")
    const tab = searchParams.get("tab") || "for-you"

    const profile = await getCurrentProfile(supabase)
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let query = supabase
      .from("posts")
      .select(`
        id,
        content,
        media_url,
        media_urls,
        tags,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        author:profiles!posts_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    if (tab === "following") {
      // Get posts from followed users
      const { data: following } = await sb.from("follows").select("followee_id").eq("follower_id", profile.id)

      const followingIds = (following as any[])?.map((f: any) => f.followee_id) || []
      if (followingIds.length === 0) {
        return NextResponse.json({ items: [], nextCursor: null, hasMore: false })
      }

      query = query.in("user_id", followingIds)
    }

  const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Check if user has liked each post
    const postIds = (posts as any[])?.map((p: any) => p.id) || []
    const { data: likes } = await sb
      .from("post_likes")
      .select("post_id")
      .eq("user_id", profile.id)
      .in("post_id", postIds)

    const likedPostIds = new Set((likes as any[])?.map((l: any) => l.post_id) || [])

    const postsWithLikes =
      (posts as any[])?.map((post: any) => ({
        ...(post || {}),
        viewerLike: likedPostIds.has(post.id),
        author: {
          id: post.author?.id,
          name: post.author?.full_name || "Anonymous",
          avatar_url: post.author?.avatar_url,
        },
      })) || []

  const nextCursor = (posts as any[]) && (posts as any[]).length === limit ? (posts as any[])[(posts as any[]).length - 1].created_at : null
  const hasMore = (posts as any[]) ? (posts as any[]).length === limit : false

  return NextResponse.json({ items: postsWithLikes, nextCursor, hasMore })
  } catch (error) {
    console.error("Posts API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
  const supabase = createSupabaseServerClient()
    const sb: any = supabase as any
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, media_url, media_urls, tags } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const { data: post, error } = await sb
      .from("posts")
      .insert({
        user_id: profile.id,
        content: content.trim(),
        media_url,
        media_urls,
        tags,
      })
      .select(`
        id,
        content,
        media_url,
        media_urls,
        tags,
        likes_count,
        comments_count,
        created_at,
        updated_at,
        author:profiles!posts_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    const p: any = post as any
    const postWithAuthor = {
      ...(p || {}),
      viewerLike: false,
      author: {
        id: p.author?.id,
        name: p.author?.full_name || "Anonymous",
        avatar_url: p.author?.avatar_url,
      },
    }

    return NextResponse.json(postWithAuthor, { status: 201 })
  } catch (error) {
    console.error("Create post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
