import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get all live campaigns for AI analysis
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, description, goal_amount, raised_amount, created_at")
      .eq("status", "live")

    if (!campaigns) {
      return NextResponse.json({ error: "No campaigns found" }, { status: 404 })
    }

    // AI optimization logic (simplified)
    const optimizedCampaigns = campaigns.map((campaign) => {
      const progressRate = campaign.raised_amount / campaign.goal_amount
      const daysActive = Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))

      // Calculate AI score based on various factors
      let aiScore = 0.5 // base score

      // Progress factor
      if (progressRate > 0.7) aiScore += 0.3
      else if (progressRate > 0.3) aiScore += 0.2
      else if (progressRate > 0.1) aiScore += 0.1

      // Activity factor
      if (daysActive < 7) aiScore += 0.1
      else if (daysActive < 30) aiScore += 0.05

      // Title/description quality (simplified check)
      if (campaign.title.length > 20 && campaign.description && campaign.description.length > 100) {
        aiScore += 0.1
      }

      return {
        campaignId: campaign.id,
        aiScore: Math.min(aiScore, 1.0),
        recommendations: generateRecommendations(campaign, progressRate, daysActive),
      }
    })

    // Store AI recommendations
    for (const optimized of optimizedCampaigns) {
      await supabase.from("ai_recommendations").insert({
        user_id: session.user.id,
        recommendation_type: "campaign_optimization",
        recommended_plan: optimized.campaignId,
        confidence: optimized.aiScore,
        reasoning: optimized.recommendations.join("; "),
      })
    }

    return NextResponse.json({
      success: true,
      optimizedCount: optimizedCampaigns.length,
      averageScore: optimizedCampaigns.reduce((sum, c) => sum + c.aiScore, 0) / optimizedCampaigns.length,
    })
  } catch (error) {
    console.error("AI optimization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateRecommendations(campaign: any, progressRate: number, daysActive: number): string[] {
  const recommendations = []

  if (progressRate < 0.1) {
    recommendations.push("Consider adding more compelling visuals to increase engagement")
    recommendations.push("Share regular updates to build trust with potential donors")
  }

  if (progressRate < 0.3) {
    recommendations.push("Leverage social media to expand your reach")
    recommendations.push("Add testimonials or impact stories to build credibility")
  }

  if (daysActive > 30 && progressRate < 0.5) {
    recommendations.push("Consider revising your campaign strategy or goal amount")
    recommendations.push("Engage with your existing donors to encourage sharing")
  }

  if (!campaign.description || campaign.description.length < 100) {
    recommendations.push("Add a more detailed description explaining your cause and impact")
  }

  return recommendations
}
