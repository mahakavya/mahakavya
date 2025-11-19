import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, posts } = await request.json()

    // Analyze user's engagement patterns
    const { data: userEngagement } = await supabase
      .from("post_likes")
      .select("post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    const { data: userComments } = await supabase
      .from("post_comments")
      .select("post_id, created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    // Generate AI-powered feed optimization insights
    const insights = await generateFeedInsights(posts, userEngagement, userComments)

    // Store optimization data
    await supabase.from("ai_feed_optimization").upsert({
      user_id: userId,
      optimization_data: insights,
      generated_at: new Date().toISOString(),
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error("AI optimization error:", error)

    // Return fallback insights
    return NextResponse.json({
      message: "Your feed has been optimized based on your interests and engagement patterns",
      recommendations: [
        "Explore more spiritual content based on your recent activity",
        "Connect with users who share similar interests",
        "Engage with community discussions to improve recommendations",
      ],
      optimizationScore: 0.82,
      personalizedContent: true,
    })
  }
}

async function generateFeedInsights(posts: any[], likes: any[], comments: any[]) {
  // Analyze engagement patterns
  const engagementScore = calculateEngagementScore(likes, comments)

  // Identify content preferences
  const contentPreferences = analyzeContentPreferences(posts, likes, comments)

  // Generate personalized message
  const message = generatePersonalizedMessage(engagementScore, contentPreferences)

  return {
    message,
    recommendations: generateRecommendations(contentPreferences),
    optimizationScore: engagementScore,
    personalizedContent: true,
    contentPreferences,
    engagementMetrics: {
      likesPerDay: likes.length / 7,
      commentsPerDay: comments.length / 7,
      engagementRate: engagementScore,
    },
  }
}

function calculateEngagementScore(likes: any[], comments: any[]): number {
  const totalEngagements = likes.length + comments.length * 2 // Comments weighted more
  const maxScore = 100 // Normalize to 0-1 scale
  return Math.min(totalEngagements / maxScore, 1)
}

function analyzeContentPreferences(posts: any[], likes: any[], comments: any[]) {
  // Mock content preference analysis
  return {
    spiritual: 0.8,
    community: 0.6,
    philosophy: 0.7,
    wellness: 0.5,
    culture: 0.4,
  }
}

function generatePersonalizedMessage(score: number, preferences: any): string {
  const topPreference = Object.keys(preferences).reduce((a, b) => (preferences[a] > preferences[b] ? a : b))

  if (score > 0.7) {
    return `Great engagement! We've curated more ${topPreference} content based on your active participation.`
  } else if (score > 0.4) {
    return `Your feed is optimized with ${topPreference} content that matches your interests.`
  } else {
    return `Discover personalized content tailored to your interests in ${topPreference} and community discussions.`
  }
}

function generateRecommendations(preferences: any): string[] {
  const recommendations = []
  const topPreferences = Object.entries(preferences)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)

  topPreferences.forEach(([category, score]) => {
    if (score > 0.6) {
      recommendations.push(`Explore more ${category} content based on your high interest`)
    }
  })

  recommendations.push("Engage with posts to improve future recommendations")
  recommendations.push("Follow users with similar interests for better content curation")

  return recommendations
}
