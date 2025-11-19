import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — prevent static prerender
export const dynamic = 'force-dynamic'
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
  const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = page * limit

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get reels with author info and user interactions
    const { data: reels, error } = await supabase
      .from("reels")
      .select(`
        *,
        author:profiles!reels_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        likes:reel_likes!left (
          user_id
        ),
        bookmarks:reel_bookmarks!left (
          user_id
        ),
        follows:follows!left (
          follower_id
        )
      `)
      .eq("status", "READY")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Failed to fetch reels:", error)
      return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 })
    }

    // Transform data to include user interaction flags
    const transformedReels = (reels || []).map((reel: any) => ({
      ...reel,
      is_liked: (reel.likes || []).some((like: any) => like.user_id === user.id) || false,
      is_bookmarked: (reel.bookmarks || []).some((bookmark: any) => bookmark.user_id === user.id) || false,
      is_following: (reel.follows || []).some((follow: any) => follow.follower_id === user.id) || false,
      // Remove the raw arrays
      likes: undefined,
      bookmarks: undefined,
      follows: undefined,
    }))

    return NextResponse.json({
      reels: transformedReels,
      hasMore: (reels || []).length === limit,
      page,
    })
  } catch (error) {
    console.error("Feed error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
