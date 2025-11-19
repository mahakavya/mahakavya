import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 })
    }

    // Get user's RPA automation settings
    const { data: rpaSettings } = await supabase
      .from("user_preferences")
      .select("rpa_automation_enabled")
      .eq("user_id", session.user.id)
      .single()

    const automationActive = rpaSettings?.rpa_automation_enabled ?? true

    // Get RPA job records
    const { data: rpaJobs } = await supabase
      .from("rpa_jobs")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("service", "sahaya")
      .order("created_at", { ascending: false })
      .limit(20)

    // Count running jobs
  const runningJobs = rpaJobs?.filter((job: any) => job.status === "running") || []
    const jobsRunning = runningJobs.length

    // Calculate optimization score based on successful automations
  const completedJobs = rpaJobs?.filter((job: any) => job.status === "completed") || []
  const failedJobs = rpaJobs?.filter((job: any) => job.status === "failed") || []
    const optimizationScore =
      rpaJobs?.length > 0 ? (completedJobs.length / (completedJobs.length + failedJobs.length)) * 100 : 85 // Default good score

    // Generate recent optimizations
    const optimizationTypes = [
      "Listener Matching",
      "Session Scheduling",
      "Response Time",
      "Engagement Quality",
      "Follow-up Automation",
    ]

    const improvements = [
      "Improved listener matching accuracy by 15%",
      "Reduced average response time by 2 minutes",
      "Enhanced session quality scoring",
      "Optimized scheduling efficiency by 25%",
      "Automated follow-up message delivery",
    ]

    const recentOptimizations = Array.from({ length: Math.min(5, completedJobs.length) }, (_, i) => ({
      id: `opt_${Date.now()}_${i}`,
      type: optimizationTypes[i % optimizationTypes.length],
      improvement: improvements[i % improvements.length],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(), // Hours ago
    }))

    // Simulate checking RPA status
    const isOptimized = Math.random() > 0.5 // Simulate optimization status

    const rpaStatus = {
      automation_active: automationActive,
      jobs_running: jobsRunning,
      optimization_score: Math.round(optimizationScore),
      recent_optimizations: recentOptimizations,
      is_optimized: isOptimized,
    }

    return NextResponse.json(rpaStatus)
  } catch (error) {
    console.error("RPA status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
