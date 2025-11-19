import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create RPA optimization job
    const jobId = `rpa_optimize_${profile.id}_${Date.now()}`

    const { error: jobError } = await supabase.from("rpa_jobs").insert({
      id: jobId,
      user_id: profile.id,
      job_type: "settings_optimization",
      status: "running",
      priority: "medium",
      job_data: {
        optimizationType: "settings",
        targetUserId: profile.id,
        startedAt: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    })

    if (jobError) {
      console.error("Error creating RPA job:", jobError)
      return NextResponse.json({ error: "Failed to start optimization" }, { status: 500 })
    }

    // Simulate optimization analysis
    const optimizationResults = await performSettingsOptimization(supabase, profile.id)

    // Update job status
    await supabase
      .from("rpa_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result: optimizationResults,
      })
      .eq("id", jobId)

    // Create optimization record
    await supabase.from("rpa_optimizations").insert({
      user_id: profile.id,
      job_id: jobId,
      optimization_type: "settings",
      efficiency_score: optimizationResults.efficiencyScore,
      suggestions: optimizationResults.suggestions,
      applied_changes: optimizationResults.appliedChanges,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      jobId,
      optimizationResults,
    })
  } catch (error) {
    console.error("Error optimizing settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function performSettingsOptimization(supabase: any, userId: string) {
  // Get user activity data
  const { data: activities } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("user_id", userId)
    .gte("timestamp", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Get current settings
  const { data: currentSettings } = await supabase.from("user_settings").select("*").eq("user_id", userId).single()

  const suggestions = []
  const appliedChanges = []
  let efficiencyScore = 75

  // Analyze notification patterns
  const notificationEvents = activities?.filter((a) => a.event_type === "notification_sent") || []
  if (notificationEvents.length > 50) {
    suggestions.push("Consider enabling smart notification timing to reduce notification fatigue")
    efficiencyScore += 5
  }

  // Analyze theme usage
  const nightActivities =
    activities?.filter((a) => {
      const hour = new Date(a.timestamp).getHours()
      return hour >= 20 || hour <= 6
    }) || []

  if (nightActivities.length > (activities?.length || 0) * 0.6) {
    suggestions.push("Dark theme recommended based on your usage patterns")
    if (currentSettings?.settings?.theme !== "dark") {
      appliedChanges.push("Theme optimized to dark mode")
      efficiencyScore += 10
    }
  }

  // Security optimization
  const loginEvents = activities?.filter((a) => a.event_type === "login") || []
  if (loginEvents.length > 20 && !currentSettings?.settings?.security?.twoFactorEnabled) {
    suggestions.push("Enable two-factor authentication for enhanced security")
    efficiencyScore -= 5
  }

  return {
    efficiencyScore: Math.min(100, efficiencyScore),
    suggestions,
    appliedChanges,
    analysisDate: new Date().toISOString(),
    dataPoints: activities?.length || 0,
  }
}
