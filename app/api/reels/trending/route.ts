import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get trending reels based on engagement metrics
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select(`
        id,
        caption,
        views,
        likes,
        thumb_url,
        created_at,
        profiles:author_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq("is_hidden", false)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order("views", { ascending: false })
      .limit(20)

    if (reelsError) {
      console.error("Failed to fetch trending reels:", reelsError)
      return NextResponse.json({ error: "Failed to fetch trending reels" }, { status: 500 })
    }

    // Calculate trending score for each reel
    const trendingReels = (reels || []).map((reel) => {
      const ageInHours = (Date.now() - new Date(reel.created_at).getTime()) / (1000 * 60 * 60)
      const viewsPerHour = reel.views / Math.max(ageInHours, 1)
      const likesPerHour = reel.likes / Math.max(ageInHours, 1)
      const engagementRate = reel.views > 0 ? (reel.likes / reel.views) * 100 : 0

      // Trending score formula: weighted combination of metrics
      const trendingScore = Math.round(viewsPerHour * 0.4 + likesPerHour * 0.3 + engagementRate * 0.3)

      // Extract hashtags from caption
      const hashtags = reel.caption?.match(/#\w+/g)?.map((tag) => tag.slice(1)) || []

      return {
        id: reel.id,
        title: reel.caption?.split("\n")[0]?.slice(0, 50) || "Untitled Reel",
        author: reel.profiles,
        views: reel.views,
        likes: reel.likes,
        comments: Math.floor(reel.likes * 0.1), // Estimate comments as 10% of likes
        trendingScore,
        hashtags: hashtags.slice(0, 3),
        thumbnail_url: reel.thumb_url,
      }
    })

    // Sort by trending score
    trendingReels.sort((a, b) => b.trendingScore - a.trendingScore)

    return NextResponse.json({ reels: trendingReels })
  } catch (error) {
    console.error("Trending reels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
