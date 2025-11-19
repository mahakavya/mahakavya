import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get active RPA jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("rpa_jobs")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "running")

    // Get latest optimization record
    const { data: optimization, error: optimizationError } = await supabase
      .from("rpa_optimizations")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Get security alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("security_alerts")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "open")

    // Calculate performance score
    const performanceScore = calculatePerformanceScore(optimization, alerts || [])

    const status = {
      activeJobs: jobs?.length || 0,
      lastOptimization: optimization?.created_at ? new Date(optimization.created_at).toLocaleDateString() : "Never",
      performanceScore,
      securityAlerts: alerts?.length || 0,
      optimizationSuggestions: optimization?.suggestions || [],
      automationEfficiency: optimization?.efficiency_score || 0,
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("Error fetching RPA status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculatePerformanceScore(optimization: any, alerts: any[]) {
  let score = 70 // Base score

  if (optimization?.efficiency_score) {
    score = Math.max(score, optimization.efficiency_score)
  }

  // Deduct points for security alerts
  score -= alerts.length * 5

  return Math.max(0, Math.min(100, score))
}
