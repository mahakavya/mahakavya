import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", profile.id)
      .single()

    if (subscription?.status !== "active") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
    }

    // Get user's RPA settings
    const { data: rpaSettings } = await supabase
      .from("user_preferences")
      .select("rpa_enabled, rpa_level")
      .eq("user_id", profile.id)
      .single()

    // Get RPA job history
    const { data: rpaJobs } = await supabase
      .from("rpa_jobs")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20)

    // Calculate RPA metrics
    const completedJobs = rpaJobs?.filter((job) => job.status === "completed").length || 0
    const totalJobs = rpaJobs?.length || 0
    const successRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 95

    // Get active tasks
    const activeJobs = rpaJobs?.filter((job) => job.status === "running" || job.status === "queued") || []

    // Calculate time saved (mock calculation)
    const timeSaved = completedJobs * 0.5 // Assume 30 minutes saved per job

    const status = {
      isEnabled: rpaSettings?.rpa_enabled || false,
      automationLevel: rpaSettings?.rpa_level || "basic",
      activeJobs: activeJobs.filter((job) => job.status === "running").length,
      completedJobs,
      successRate,
      timeSaved: Math.round(timeSaved),
      nextOptimization: "Analyze entry patterns for optimal timing recommendations",
      currentTasks: activeJobs.map((job) => ({
        id: job.id,
        name:
          job.job_type === "draw_analysis"
            ? "Draw Pattern Analysis"
            : job.job_type === "entry_optimization"
              ? "Entry Timing Optimization"
              : job.job_type === "result_notification"
                ? "Result Notification Setup"
                : "General Optimization",
        status: job.status,
        progress: job.status === "running" ? Math.floor(Math.random() * 80) + 10 : 100,
        estimatedTime: job.status === "running" ? `${Math.floor(Math.random() * 10) + 1} min` : "Completed",
      })),
      benefits: {
        autoEntry: rpaSettings?.rpa_enabled || false,
        smartTiming: rpaSettings?.rpa_level === "advanced" || rpaSettings?.rpa_level === "premium" || false,
        resultNotifications: rpaSettings?.rpa_enabled || false,
        performanceAnalytics: rpaSettings?.rpa_level === "premium" || false,
      },
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("RPA status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
