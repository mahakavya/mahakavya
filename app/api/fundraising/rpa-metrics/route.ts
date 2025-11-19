import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()

    // Get RPA optimization stats
    const { data: rpaJobs } = await supabase
      .from("rpa_tasks")
      .select("status, task_type, completed_at, created_at")
      .eq("task_type", "campaign_optimization")

    const optimizedCampaigns = rpaJobs?.filter((job) => job.status === "completed").length || 0

    // Calculate automation savings (mock calculation)
    const automationSavings = optimizedCampaigns * 2.5 // hours saved per campaign

    // Calculate process efficiency
    const completedJobs = rpaJobs?.filter((job) => job.status === "completed") || []
    const totalJobs = rpaJobs?.length || 1

    const processEfficiency = Math.round((completedJobs.length / totalJobs) * 100)

    return NextResponse.json({
      optimizedCampaigns,
      automationSavings,
      processEfficiency,
    })
  } catch (error) {
    console.error("RPA metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
