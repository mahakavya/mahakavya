import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AIAnalysisSchema = z.object({
  analysis_type: z.enum(["behavior_analysis", "risk_assessment", "engagement_pattern", "recommendation"]),
  user_ids: z.array(z.string().uuid()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    const body = await request.json()
    const { analysis_type, user_ids } = AIAnalysisSchema.parse(body)

    // Create AI job
    const { data: aiJob, error: jobError } = await supabase
      .from("ai_jobs")
      .insert({
        job_type: analysis_type,
        status: "running",
        started_by: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      console.error("Error creating AI job:", jobError)
      return NextResponse.json({ error: "Failed to create AI job" }, { status: 500 })
    }

    // Process AI analysis asynchronously
    processAIAnalysis(aiJob.id, analysis_type, user_ids)

    return NextResponse.json({
      success: true,
      message: "AI analysis started successfully",
      data: { job_id: aiJob.id },
    })
  } catch (error) {
    console.error("Error in AI analysis POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function processAIAnalysis(jobId: string, analysisType: string, userIds?: string[]) {
  const supabase = await createClient()

  try {
    // Get users to analyze
    let query = supabase.from("profiles").select("*")

    if (userIds && userIds.length > 0) {
      query = query.in("id", userIds)
    } else {
      // Analyze all users if no specific IDs provided
      query = query.limit(100) // Limit for performance
    }

    const { data: users, error: usersError } = await query

    if (usersError || !users) {
      throw new Error("Failed to fetch users for analysis")
    }

    const insights = []

    for (const user of users) {
      // Generate AI insights based on analysis type
      let insight

      switch (analysisType) {
        case "behavior_analysis":
          insight = await generateBehaviorInsight(user)
          break
        case "risk_assessment":
          insight = await generateRiskInsight(user)
          break
        case "engagement_pattern":
          insight = await generateEngagementInsight(user)
          break
        case "recommendation":
          insight = await generateRecommendationInsight(user)
          break
        default:
          continue
      }

      if (insight) {
        insights.push(insight)

        // Store insight in database
        await supabase.from("ai_insights").insert({
          user_id: user.id,
          insight_type: analysisType,
          severity: insight.severity,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          actions_suggested: insight.actions_suggested,
          created_at: new Date().toISOString(),
        })
      }
    }

    // Update AI job as completed
    await supabase
      .from("ai_jobs")
      .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
        results: {
          insights_generated: insights.length,
          users_analyzed: users.length,
        },
      })
      .eq("id", jobId)
  } catch (error) {
    console.error("Error processing AI analysis:", error)

    // Mark job as failed
    await supabase
      .from("ai_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", jobId)
  }
}

async function generateBehaviorInsight(user: any) {
  // Mock AI behavior analysis
  const riskScore = user.ai_risk_score || 0
  const violationCount = user.violation_count || 0

  if (violationCount > 3) {
    return {
      severity: "high" as const,
      title: "Repeated Policy Violations",
      description: `User has ${violationCount} policy violations, indicating potential problematic behavior patterns.`,
      confidence: 0.85,
      actions_suggested: ["Review recent activity", "Consider temporary suspension", "Send warning message"],
    }
  }

  if (riskScore > 70) {
    return {
      severity: "medium" as const,
      title: "High Risk Behavior Pattern",
      description: "AI analysis indicates potentially risky behavior patterns that warrant monitoring.",
      confidence: 0.72,
      actions_suggested: ["Increase monitoring", "Review content history", "Consider verification requirements"],
    }
  }

  return null
}

async function generateRiskInsight(user: any) {
  // Mock AI risk assessment
  const riskScore = user.ai_risk_score || 0
  const isVerified = user.is_verified || false
  const accountAge = Date.now() - new Date(user.created_at).getTime()
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)

  if (riskScore > 80 && !isVerified && daysSinceCreation < 7) {
    return {
      severity: "critical" as const,
      title: "High-Risk New Account",
      description: "New account with high AI risk score and no verification. Potential security threat.",
      confidence: 0.92,
      actions_suggested: ["Require immediate verification", "Limit account privileges", "Monitor all activity"],
    }
  }

  return null
}

async function generateEngagementInsight(user: any) {
  // Mock engagement pattern analysis
  const engagementRate = user.engagement_rate || 0
  const contentCount = user.content_count || 0

  if (engagementRate < 10 && contentCount > 50) {
    return {
      severity: "low" as const,
      title: "Low Engagement Despite High Activity",
      description: "User posts frequently but receives low engagement, may indicate content quality issues.",
      confidence: 0.68,
      actions_suggested: ["Provide content guidelines", "Suggest engagement best practices", "Review content quality"],
    }
  }

  return null
}

async function generateRecommendationInsight(user: any) {
  // Mock recommendation generation
  const reputationScore = user.reputation_score || 0
  const isVerified = user.is_verified || false

  if (reputationScore > 80 && !isVerified) {
    return {
      severity: "low" as const,
      title: "Verification Candidate",
      description: "User has high reputation score and would benefit from verification status.",
      confidence: 0.75,
      actions_suggested: ["Offer verification process", "Highlight user contributions", "Consider premium features"],
    }
  }

  return null
}
