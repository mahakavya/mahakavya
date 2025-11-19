import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { validateAdmin } from "@/lib/access"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    // Use a looser typing for the supabase instance because some project
    // tables/functions are not present in the generated Database types yet.
    const sb: any = supabase

    // Validate admin access by checking the logged-in session user id
    const sessionRes = await sb.auth.getSession()
    const userId = sessionRes?.data?.session?.user?.id
    const adminCheck = await validateAdmin(userId)
    if (!adminCheck.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { range } = await request.json()

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Calculate date range
    const now = new Date()
    const daysBack = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch data for AI analysis
    const [userActivityResult, contentMetricsResult, engagementResult] = await Promise.all([
      sb.from("profiles").select("id, created_at, last_sign_in_at").gte("created_at", startDate.toISOString()),

      sb.from("posts").select("id, created_at, content_score, safety_score").gte("created_at", startDate.toISOString()),

      sb.from("post_likes").select("id, created_at").gte("created_at", startDate.toISOString()),
    ])

  type UserRow = { id: string; created_at: string; last_sign_in_at?: string | null }
  type PostRow = { id: string; created_at: string; content_score?: number | null; safety_score?: number | null }
  type EngagementRow = { id: string; created_at: string }

  const users: UserRow[] = (userActivityResult?.data as UserRow[]) || []
  const content: PostRow[] = (contentMetricsResult?.data as PostRow[]) || []
  const engagement: EngagementRow[] = (engagementResult?.data as EngagementRow[]) || []

    // AI-powered analysis
    const userBehaviorScore = Math.min(
      100,
      Math.round(
        (users.filter((u: UserRow) => u.last_sign_in_at && new Date(u.last_sign_in_at) > startDate).length /
          Math.max(users.length, 1)) *
          100,
      ),
    )

    const contentQualityScore = Math.min(
      100,
      Math.round(
        content.reduce((sum: number, post: PostRow) => sum + (post.content_score || 75), 0) / Math.max(content.length, 1),
      ),
    )

    const engagementTrend = engagement.length / Math.max(content.length, 1)
    const riskAssessment = userBehaviorScore > 80 ? "LOW" : userBehaviorScore > 60 ? "MEDIUM" : "HIGH"

    // Generate predictions using mock AI algorithms
    const userGrowthTrend =
      users.length > 0
        ? (users.filter((u: UserRow) => new Date(u.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length / 7) *
          30
        : 0

    const predictions = {
      userGrowth: Math.max(0, Math.min(50, Math.round(userGrowthTrend + Math.random() * 10))),
      revenueGrowth: Math.max(0, Math.min(30, Math.round(engagementTrend * 15 + Math.random() * 8))),
      churnPrediction: Math.max(0, Math.min(25, Math.round((100 - userBehaviorScore) * 0.3 + Math.random() * 5))),
    }

    // Generate contextual recommendations
    const recommendations = []

    if (userBehaviorScore < 70) {
      recommendations.push("Implement user onboarding improvements to increase engagement")
    }
    if (contentQualityScore < 80) {
      recommendations.push("Deploy AI content moderation to enhance content quality")
    }
    if (engagementTrend < 2) {
      recommendations.push("Launch gamification features to boost user interaction")
    }
    if (predictions.churnPrediction > 15) {
      recommendations.push("Create retention campaigns targeting at-risk user segments")
    }

    // Always include some general recommendations
    recommendations.push(
      "Optimize mobile experience based on device usage patterns",
      "Implement personalized content recommendations",
      "Enhance real-time notification system",
    )

    const aiInsights = {
      userBehaviorScore,
      contentQualityScore,
      riskAssessment,
      predictions,
      recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
      analysisTimestamp: new Date().toISOString(),
      confidence: Math.round(85 + Math.random() * 10), // Mock confidence score
    }

    // Store AI insights for future reference
    await sb.from("ai_analytics_insights").insert({
      date_range: range,
      insights: aiInsights,
      generated_at: new Date().toISOString(),
    })

    return NextResponse.json(aiInsights)
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Failed to generate AI insights" }, { status: 500 })
  }
}
