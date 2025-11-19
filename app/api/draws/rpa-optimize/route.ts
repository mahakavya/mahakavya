import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
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

    // Create optimization job
    const { data: job, error } = await supabase
      .from("rpa_jobs")
      .insert({
        user_id: profile.id,
        job_type: "draw_optimization",
        status: "queued",
        priority: "high",
        meta: {
          optimization_type: "full_analysis",
          requested_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create optimization job:", error)
      return NextResponse.json({ error: "Failed to start optimization" }, { status: 500 })
    }

    // Log the optimization request
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "rpa_optimization_requested",
      entity: "draws_automation",
      entity_id: job.id,
      meta: { job_type: "draw_optimization" },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "Optimization job started successfully",
    })
  } catch (error) {
    console.error("RPA optimize error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
