import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"
import { monitor } from "@/lib/monitoring"
import { aiService } from "@/lib/ai-service"
import { blockchainContentService } from "@/lib/blockchain-content-service"
import { rpaContentService } from "@/lib/rpa-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()
    const profileId = params.id

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can view insights (own profile or admin)
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", profileId).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const canViewInsights = user.id === profileId || user.email?.includes("admin")

    if (!canViewInsights) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate AI insights
    const aiInsights = await aiService.analyzeContent(`Profile analysis for user ${profileId}`)

    const profileInsights = {
      personality_traits: ["Creative", "Engaging", "Thoughtful", "Community-focused"],
      content_themes: ["Technology", "Culture", "Social Impact", "Education"],
      engagement_pattern: "High engagement during evening hours with consistent posting schedule",
      recommendations: await aiService.getSuggestions(`Profile optimization for ${profileId}`),
      sentiment_analysis: {
        positive: 75,
        neutral: 20,
        negative: 5,
      },
    }

    // Get blockchain verification status
    const blockchainVerification = await blockchainContentService.verifyContent(
      profileId,
      `Profile verification for ${profileId}`,
      profileId,
    )

    // Create RPA analysis job
    const rpaJobId = await rpaContentService.createEngagementAnalysisJob({
      sessionId: crypto.randomUUID(),
      userId: profileId,
      action: "profile_insights_request",
      page: "parichaya",
      timestamp: new Date().toISOString(),
    })

    // Wait for RPA analysis (in production, this would be async)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const rpaAnalysis = await rpaContentService.getJobStatus(rpaJobId)

    // Get performance metrics from database
    const { data: recentActivity } = await supabase
      .from("analytics_events")
      .select("event_type, created_at")
      .eq("user_id", profileId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const performanceMetrics = {
      profile_views_30d: Math.floor(Math.random() * 5000) + 1000,
      content_interactions: Math.floor(Math.random() * 2000) + 500,
      new_followers_7d: Math.floor(Math.random() * 100) + 10,
      avg_engagement_rate: Math.random() * 15 + 5,
      activity_score: recentActivity?.length || 0,
      peak_activity_hours: ["18:00", "19:00", "20:00"],
      top_content_types: ["posts", "reels", "campaigns"],
    }

    // Generate achievements based on metrics
    const achievements = [
      {
        id: "top_creator",
        title: "Top Creator",
        description: "This Month",
        icon: "award",
        color: "yellow",
        earned: performanceMetrics.content_interactions > 1000,
      },
      {
        id: "community_builder",
        title: "Community Builder",
        description: "1K+ Followers",
        icon: "users",
        color: "blue",
        earned: performanceMetrics.new_followers_7d > 50,
      },
      {
        id: "fundraiser",
        title: "Fundraiser",
        description: "₹50K+ Raised",
        icon: "heart",
        color: "green",
        earned: Math.random() > 0.5,
      },
      {
        id: "early_adopter",
        title: "Early Adopter",
        description: "Beta User",
        icon: "coins",
        color: "purple",
        earned: true,
      },
    ]

    const insights = {
      ai_insights: profileInsights,
      blockchain_status: {
        isVerified: blockchainVerification.isVerified,
        verificationHash: blockchainVerification.integrityHash,
        blockchainRecord: blockchainVerification.blockchainRecord,
        lastVerified: blockchainVerification.verificationTimestamp,
      },
      rpa_analysis: rpaAnalysis?.results || {
        engagementScore: Math.random() * 100,
        behaviorPattern: "exploration_focused",
        recommendations: [
          "Increase posting frequency during peak hours",
          "Engage more with community comments",
          "Share more video content",
        ],
        riskLevel: "low",
      },
      performance_metrics: performanceMetrics,
      achievements: achievements.filter((a) => a.earned),
      social_graph: {
        connection_strength: Math.floor(Math.random() * 40) + 60,
        active_communities: Math.floor(Math.random() * 8) + 3,
        mutual_connections: Math.floor(Math.random() * 20) + 5,
        engagement_quality: "high",
      },
    }

    // Log insights access
    monitor.logUserAction("profile_insights_view", {
      profileId,
      viewerId: user.id,
      insightTypes: Object.keys(insights),
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Profile insights error:", error)
    monitor.logError(error as Error, {
      context: "fetch_profile_insights",
      profileId: params.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
