import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    // Get user's interaction history for personalization
    const { data: interactions, error: interactionsError } = await supabase
      .from("reel_likes")
      .select(`
        reel_id,
        reels (
          id,
          caption,
          author_id,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (interactionsError) {
      console.error("Failed to fetch user interactions:", interactionsError)
    }

    // Analyze user preferences
    const likedReels = interactions?.map((i) => i.reels).filter(Boolean) || []
    const preferences = {
      preferredAuthors: this.getTopAuthors(likedReels),
      preferredTopics: this.extractTopics(likedReels),
      engagementPatterns: this.analyzeEngagementPatterns(likedReels),
    }

    // Create AI optimization record
    const { error: optimizationError } = await supabase.from("ai_insights").insert({
      entity_type: "user_feed",
      entity_id: user.id,
      user_id: user.id,
      insight_type: "feed_optimization",
      insight_data: {
        preferences: preferences,
        optimization_timestamp: new Date().toISOString(),
        algorithm_version: "v2.1",
        personalization_score: this.calculatePersonalizationScore(preferences),
      },
      confidence_score: 0.78,
    })

    if (optimizationError) {
      console.error("Failed to store optimization data:", optimizationError)
    }

    // Update user's feed preferences
    const { error: preferencesError } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      preference_type: "feed_algorithm",
      preference_data: preferences,
      updated_at: new Date().toISOString(),
    })

    if (preferencesError) {
      console.error("Failed to update user preferences:", preferencesError)
    }

    return NextResponse.json({
      success: true,
      preferences: preferences,
      message: "Feed optimized based on your preferences",
    })
  } catch (error) {
    console.error("Feed optimization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getTopAuthors(reels: any[]): string[] {
  const authorCounts = new Map<string, number>()

  reels.forEach((reel) => {
    if (reel.author_id) {
      authorCounts.set(reel.author_id, (authorCounts.get(reel.author_id) || 0) + 1)
    }
  })

  return Array.from(authorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([authorId]) => authorId)
}

function extractTopics(reels: any[]): string[] {
  const topics = new Set<string>()

  reels.forEach((reel) => {
    if (reel.caption) {
      // Extract hashtags
      const hashtags = reel.caption.match(/#\w+/g) || []
      hashtags.forEach((tag) => topics.add(tag.slice(1).toLowerCase()))

      // Extract keywords (simplified)
      const words = reel.caption.toLowerCase().match(/\b\w{4,}\b/g) || []
      words.slice(0, 3).forEach((word) => topics.add(word))
    }
  })

  return Array.from(topics).slice(0, 20)
}

function analyzeEngagementPatterns(reels: any[]): any {
  const hourlyEngagement = new Map<number, number>()
  const dailyEngagement = new Map<string, number>()

  reels.forEach((reel) => {
    const date = new Date(reel.created_at)
    const hour = date.getHours()
    const day = date.toLocaleDateString("en-US", { weekday: "long" })

    hourlyEngagement.set(hour, (hourlyEngagement.get(hour) || 0) + 1)
    dailyEngagement.set(day, (dailyEngagement.get(day) || 0) + 1)
  })

  const bestHour = Array.from(hourlyEngagement.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 19

  const bestDay = Array.from(dailyEngagement.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sunday"

  return {
    preferredHour: bestHour,
    preferredDay: bestDay,
    engagementFrequency: reels.length > 10 ? "high" : reels.length > 3 ? "medium" : "low",
  }
}

function calculatePersonalizationScore(preferences: any): number {
  let score = 0.5 // Base score

  if (preferences.preferredAuthors.length > 0) score += 0.2
  if (preferences.preferredTopics.length > 5) score += 0.2
  if (preferences.engagementPatterns.engagementFrequency === "high") score += 0.1

  return Math.min(1.0, score)
}
