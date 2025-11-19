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

    // Get all live campaigns for RPA optimization
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, description, owner_id, goal_amount, raised_amount, created_at")
      .eq("status", "live")

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No campaigns found for optimization",
        optimizedCount: 0,
      })
    }

    let optimizedCount = 0

    // Process each campaign for RPA optimization
    for (const campaign of campaigns) {
      try {
        // Create RPA task for campaign optimization
        const rpaTask = await supabase
          .from("rpa_tasks")
          .insert({
            user_id: campaign.owner_id,
            task_type: "campaign_optimization",
            plan_id: campaign.id,
            status: "scheduled",
            scheduled_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (rpaTask.data) {
          // Simulate RPA analysis and optimization
          const analysis = await performRPAAnalysis(campaign)

          // Update RPA task with results
          await supabase
            .from("rpa_tasks")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              result: analysis,
            })
            .eq("id", rpaTask.data.id)

          // Store RPA analysis
          await supabase.from("rpa_analyses").insert({
            user_id: campaign.owner_id,
            analysis_type: "campaign_optimization",
            plan_id: campaign.id,
            insights: analysis.insights,
            automation_tasks: analysis.automationTasks,
            preferences: analysis.preferences,
          })

          optimizedCount++
        }
      } catch (error) {
        console.error(`Failed to optimize campaign ${campaign.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      optimizedCount,
      totalCampaigns: campaigns.length,
    })
  } catch (error) {
    console.error("RPA optimization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function performRPAAnalysis(campaign: any) {
  // Simulate RPA analysis (in production, this would involve actual automation)
  const progressRate = campaign.raised_amount / campaign.goal_amount
  const daysActive = Math.floor((Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24))

  const insights = []
  const automationTasks = []
  const preferences = {}

  // Generate insights based on campaign performance
  if (progressRate < 0.2) {
    insights.push("Campaign needs increased visibility and engagement")
    automationTasks.push("schedule_social_media_posts")
    automationTasks.push("send_donor_outreach_emails")
  }

  if (daysActive > 14 && progressRate < 0.5) {
    insights.push("Campaign may benefit from strategy adjustment")
    automationTasks.push("analyze_competitor_campaigns")
    automationTasks.push("optimize_campaign_description")
  }

  if (!campaign.description || campaign.description.length < 200) {
    insights.push("Campaign description could be more detailed")
    automationTasks.push("enhance_campaign_content")
  }

  // Set optimization preferences
  preferences.autoShare = true
  preferences.donorEngagement = progressRate < 0.3
  preferences.contentOptimization = true
  preferences.performanceTracking = true

  return {
    insights: insights.join("; "),
    automationTasks,
    preferences,
    optimizationScore: Math.min(0.9, 0.5 + progressRate * 0.4),
    processedAt: new Date().toISOString(),
  }
}
