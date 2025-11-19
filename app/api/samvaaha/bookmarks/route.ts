import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — make dynamic to avoid static prerender
export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/supabase/server"
import { buildPaginatedResponse, parseCursor } from "@/lib/pagination"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 50)

    let query = supabase
      .from("bookmarks")
      .select(`
        created_at,
        post:posts(
          *,
          author:user_profiles!posts_author_id_fkey(id, display_name, avatar_url)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1)

    // Apply cursor pagination
    if (cursor) {
      const parsed = parseCursor(cursor)
      if (parsed) {
        query = query.lt("created_at", parsed.createdAt)
      }
    }

    const { data: bookmarks, error: bookmarksError } = await query

    if (bookmarksError) {
      console.error("Error fetching bookmarks:", bookmarksError)
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }

    // Transform the data to match expected format
    const posts = (bookmarks || [])
      .filter((bookmark: any) => bookmark.post)
      .map((bookmark: any) => {
        const post = bookmark.post as any
        return {
          id: post.id || String(post.uuid || post._id || `${bookmark.created_at}`),
          ...post,
          viewerHasLiked: false, // We'd need to join with post_likes to get this
          viewerBookmarked: true, // Always true since these are user's bookmarks
          created_at: (bookmark.created_at && String(bookmark.created_at)) || String(post.created_at || new Date().toISOString()),
        }
      }) as { id: string; created_at: string }[]

    const paginatedResponse = buildPaginatedResponse(posts, limit)

    return NextResponse.json(paginatedResponse)
  } catch (error) {
    console.error("Error in GET /api/samvaaha/bookmarks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
