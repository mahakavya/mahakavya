import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { aiContentService } from "@/lib/ai-content-service"

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

    // Get user's recent reels for analysis
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select(`
        id,
        caption,
        views,
        likes,
        created_at,
        video_url
      `)
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (reelsError) {
      console.error("Failed to fetch user reels:", reelsError)
      return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 })
    }

    // Calculate engagement metrics
    const totalViews = reels?.reduce((sum, reel) => sum + reel.views, 0) || 0
    const totalLikes = reels?.reduce((sum, reel) => sum + reel.likes, 0) || 0
    const engagementScore = totalViews > 0 ? Math.round((totalLikes / totalViews) * 100) : 0

    // Get trending hashtags
    const { data: trendingTags } = await supabase
      .from("hashtag_trends")
      .select("tag, usage_count")
      .order("usage_count", { ascending: false })
      .limit(5)

    // AI-powered content suggestions
    const recentCaptions =
      reels
        ?.map((r) => r.caption)
        .filter(Boolean)
        .join(" ") || ""
    let contentSuggestions: string[] = []

    if (recentCaptions) {
      try {
        const analysis = await aiContentService.analyzeContent(recentCaptions)
        contentSuggestions = [
          "Try adding trending music to boost engagement",
          "Consider posting during peak hours (7-9 PM)",
          "Use more interactive elements like polls or questions",
          "Experiment with different video lengths",
          "Add captions for better accessibility",
        ]
      } catch (error) {
        console.error("AI analysis failed:", error)
      }
    }

    // Determine optimal posting time based on user's historical performance
    const hourlyPerformance = new Map<number, number>()
    reels?.forEach((reel) => {
      const hour = new Date(reel.created_at).getHours()
      const performance = reel.views + reel.likes * 2 // Weight likes more
      hourlyPerformance.set(hour, (hourlyPerformance.get(hour) || 0) + performance)
    })

    let optimalHour = 19 // Default to 7 PM
    let maxPerformance = 0
    hourlyPerformance.forEach((performance, hour) => {
      if (performance > maxPerformance) {
        maxPerformance = performance
        optimalHour = hour
      }
    })

    const optimalPostTime = `${optimalHour}:00`

    // Audience insights based on engagement patterns
    const audienceInsights = {
      primaryAge: "18-34", // This would come from actual analytics
      topInterests: trendingTags?.slice(0, 3).map((t) => t.tag) || ["lifestyle", "entertainment", "music"],
      engagementPattern:
        engagementScore > 5 ? "high_engagement" : engagementScore > 2 ? "moderate_engagement" : "low_engagement",
    }

    const insights = {
      engagementScore,
      recommendedTags: trendingTags?.slice(0, 5).map((t) => t.tag) || [],
      optimalPostTime,
      audienceInsights,
      contentSuggestions,
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
