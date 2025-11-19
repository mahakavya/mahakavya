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

    // Get user's reels for analytics
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select(`
        id,
        views,
        likes,
        created_at,
        video_url
      `)
      .eq("author_id", user.id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })

    if (reelsError) {
      console.error("Failed to fetch user reels:", reelsError)
      return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 })
    }

    if (!reels || reels.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        engagementRate: 0,
        averageWatchTime: 0,
        topPerformingTime: "19:00",
        audienceRetention: 0,
        growthRate: 0,
      })
    }

    // Calculate basic metrics
    const totalViews = reels.reduce((sum, reel) => sum + reel.views, 0)
    const totalLikes = reels.reduce((sum, reel) => sum + reel.likes, 0)
    const totalShares = Math.floor(totalLikes * 0.05) // Estimate shares as 5% of likes
    const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0

    // Calculate average watch time (simulated based on engagement)
    const averageWatchTime = Math.floor(30 + engagementRate * 2) // 30-90 seconds based on engagement

    // Find optimal posting time based on performance
    const hourlyPerformance = new Map<number, { views: number; likes: number; count: number }>()

    reels.forEach((reel) => {
      const hour = new Date(reel.created_at).getHours()
      const existing = hourlyPerformance.get(hour) || { views: 0, likes: 0, count: 0 }
      hourlyPerformance.set(hour, {
        views: existing.views + reel.views,
        likes: existing.likes + reel.likes,
        count: existing.count + 1,
      })
    })

    let bestHour = 19 // Default to 7 PM
    let bestPerformance = 0

    hourlyPerformance.forEach((performance, hour) => {
      const avgPerformance = (performance.views + performance.likes * 2) / performance.count
      if (avgPerformance > bestPerformance) {
        bestPerformance = avgPerformance
        bestHour = hour
      }
    })

    const topPerformingTime = `${bestHour.toString().padStart(2, "0")}:00`

    // Calculate audience retention (simulated)
    const audienceRetention = Math.min(100, Math.max(20, 60 + engagementRate * 2))

    // Calculate growth rate (compare last 7 days vs previous 7 days)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentReels = reels.filter((reel) => new Date(reel.created_at) > sevenDaysAgo)
    const previousReels = reels.filter((reel) => {
      const date = new Date(reel.created_at)
      return date > fourteenDaysAgo && date <= sevenDaysAgo
    })

    const recentViews = recentReels.reduce((sum, reel) => sum + reel.views, 0)
    const previousViews = previousReels.reduce((sum, reel) => sum + reel.views, 0)

    const growthRate =
      previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : recentViews > 0 ? 100 : 0

    const analytics = {
      totalViews,
      totalLikes,
      totalShares,
      engagementRate: Math.round(engagementRate * 10) / 10,
      averageWatchTime,
      topPerformingTime,
      audienceRetention: Math.round(audienceRetention),
      growthRate: Math.round(growthRate * 10) / 10,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
