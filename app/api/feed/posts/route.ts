import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const type = searchParams.get("type") || "for-you"
    const filter = searchParams.get("filter") || "all"
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let queryBuilder = supabase
      .from("posts")
      .select(`
        id,
        content,
        created_at,
        likes_count,
        comments_count,
        shares_count,
        hashtags,
        ai_score,
        blockchain_verified,
        rpa_optimized,
        media_url,
        visibility,
        author:profiles!posts_author_id_fkey (
          id,
          name,
          avatar_url,
          verified
        ),
        user_likes:post_likes!left (
          user_id
        ),
        user_bookmarks:post_bookmarks!left (
          user_id
        )
      `)
      .eq("user_likes.user_id", user.id)
      .eq("user_bookmarks.user_id", user.id)

    // Apply filters based on type
    switch (type) {
      case "following":
        const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

        const followingIds = following?.map((f) => f.following_id) || []
        if (followingIds.length > 0) {
          queryBuilder = queryBuilder.in("author_id", followingIds)
        } else {
          // If not following anyone, return empty array
          return NextResponse.json({ posts: [] })
        }
        break

      case "trending":
        queryBuilder = queryBuilder
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("likes_count", { ascending: false })
        break

      case "latest":
        queryBuilder = queryBuilder.order("created_at", { ascending: false })
        break

      default: // for-you
        // AI-powered personalized feed
        queryBuilder = queryBuilder.order("ai_score", { ascending: false }).order("created_at", { ascending: false })
    }

    // Apply additional filters
    switch (filter) {
      case "following":
        const { data: followingUsers } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)

        const followingUserIds = followingUsers?.map((f) => f.following_id) || []
        if (followingUserIds.length > 0) {
          queryBuilder = queryBuilder.in("author_id", followingUserIds)
        }
        break

      case "trending":
        queryBuilder = queryBuilder
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .gte("likes_count", 5)
        break

      case "ai-enhanced":
        queryBuilder = queryBuilder.gte("ai_score", 0.7)
        break

      case "verified":
        queryBuilder = queryBuilder.eq("blockchain_verified", true)
        break
    }

    // Apply search query
    if (query) {
      queryBuilder = queryBuilder.or(`content.ilike.%${query}%,hashtags.cs.{${query}}`)
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: posts, error } = await queryBuilder

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    // Transform the data
    const transformedPosts =
      posts?.map((post) => ({
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        shares_count: post.shares_count || 0,
        hashtags: post.hashtags || [],
        ai_score: post.ai_score || 0,
        blockchain_verified: post.blockchain_verified || false,
        rpa_optimized: post.rpa_optimized || false,
        media_url: post.media_url,
        visibility: post.visibility || "public",
        author: {
          id: post.author?.id,
          name: post.author?.name || "Unknown User",
          avatar: post.author?.avatar_url,
          verified: post.author?.verified || false,
        },
        is_liked: post.user_likes?.length > 0,
        is_bookmarked: post.user_bookmarks?.length > 0,
      })) || []

    return NextResponse.json({ posts: transformedPosts })
  } catch (error) {
    console.error("Error in feed posts API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content, visibility = "public", media_url } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Extract hashtags
    const hashtags = content.match(/#\w+/g)?.map((tag: string) => tag.slice(1)) || []

    // AI content analysis
    let aiScore = 0.5
    try {
      const aiResponse = await fetch(`${process.env.AI_SERVICE_URL}/analyze-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        aiScore = aiData.score || 0.5
      }
    } catch (error) {
      console.error("AI analysis failed:", error)
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        content: content.trim(),
        hashtags,
        visibility,
        media_url,
        ai_score: aiScore,
        blockchain_verified: false,
        rpa_optimized: true,
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        content,
        created_at,
        hashtags,
        ai_score,
        blockchain_verified,
        rpa_optimized,
        media_url,
        visibility,
        author:profiles!posts_author_id_fkey (
          id,
          name,
          avatar_url,
          verified
        )
      `)
      .single()

    if (postError) {
      console.error("Error creating post:", postError)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    // Blockchain verification (async)
    if (process.env.BLOCKCHAIN_API_KEY) {
      fetch(`${process.env.AI_SERVICE_URL}/blockchain/verify-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          content: content,
          author_id: user.id,
        }),
      }).catch(console.error)
    }

    // Transform response
    const transformedPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      hashtags: post.hashtags || [],
      ai_score: post.ai_score || 0,
      blockchain_verified: post.blockchain_verified || false,
      rpa_optimized: post.rpa_optimized || false,
      media_url: post.media_url,
      visibility: post.visibility || "public",
      author: {
        id: post.author?.id,
        name: post.author?.name || "Unknown User",
        avatar: post.author?.avatar_url,
        verified: post.author?.verified || false,
      },
      is_liked: false,
      is_bookmarked: false,
    }

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post: transformedPost,
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
