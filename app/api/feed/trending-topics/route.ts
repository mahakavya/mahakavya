import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get trending hashtags from the last 24 hours
    const { data: posts, error } = await supabase
      .from("posts")
      .select("hashtags, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not("hashtags", "is", null)

    if (error) {
      console.error("Error fetching trending topics:", error)
      return NextResponse.json({ error: "Failed to fetch trending topics" }, { status: 500 })
    }

    // Count hashtag occurrences
    const hashtagCounts: Record<string, { count: number; recent: number }> = {}

    posts?.forEach((post) => {
      const isRecent = new Date(post.created_at) > new Date(Date.now() - 6 * 60 * 60 * 1000) // Last 6 hours

      post.hashtags?.forEach((hashtag: string) => {
        if (!hashtagCounts[hashtag]) {
          hashtagCounts[hashtag] = { count: 0, recent: 0 }
        }
        hashtagCounts[hashtag].count++
        if (isRecent) {
          hashtagCounts[hashtag].recent++
        }
      })
    })

    // Calculate trending topics with growth rate
    const trendingTopics = Object.entries(hashtagCounts)
      .map(([hashtag, data]) => ({
        hashtag,
        count: data.count,
        growth_rate: data.recent > 0 ? Math.round((data.recent / data.count) * 100) : 0,
      }))
      .filter((topic) => topic.count >= 2) // Minimum 2 posts
      .sort((a, b) => {
        // Sort by growth rate first, then by count
        if (b.growth_rate !== a.growth_rate) {
          return b.growth_rate - a.growth_rate
        }
        return b.count - a.count
      })
      .slice(0, 10) // Top 10 trending topics

    return NextResponse.json({
      success: true,
      topics: trendingTopics,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in trending topics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
