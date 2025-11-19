import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/rpa/toggle-automation", "POST", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, automationId, action } = body

    if (!automationId || !action || !["pause", "resume"].includes(action)) {
      monitoring.logApiCall("/api/rpa/toggle-automation", "POST", Date.now() - startTime, 400, session.user.id)
      return NextResponse.json({ error: "Invalid automation ID or action" }, { status: 400 })
    }

    // Update automation status
    const newStatus = action === "pause" ? "paused" : "running"

    const { data: automation, error: updateError } = await supabase
      .from("user_automations")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", automationId)
      .eq("user_id", userId)
      .select()
      .single()

    if (updateError || !automation) {
      monitoring.logError(
        new Error(`Failed to update automation: ${updateError?.message}`),
        {
          automationId,
          action,
        },
        session.user.id,
      )
      return NextResponse.json({ error: "Failed to update automation" }, { status: 500 })
    }

    // Log the automation toggle
    await supabase.from("user_activity_logs").insert({
      user_id: userId,
      action: "automation_toggled",
      details: {
        automationId,
        automationName: automation.automation_name,
        previousStatus: action === "pause" ? "running" : "paused",
        newStatus,
        toggledAt: new Date().toISOString(),
      },
    })

    // If resuming, create a new RPA job
    if (action === "resume") {
      await supabase.from("rpa_jobs").insert({
        user_id: userId,
        job_type: automation.automation_type || "content_optimization",
        status: "queued",
        parameters: {
          automationId,
          resumedAt: new Date().toISOString(),
        },
        progress: 0,
      })
    }

    const response = {
      success: true,
      message: `Automation ${action === "pause" ? "paused" : "resumed"} successfully`,
      automation: {
        id: automation.id,
        name: automation.automation_name,
        status: newStatus,
        type: automation.automation_type,
      },
    }

    monitoring.logApiCall("/api/rpa/toggle-automation", "POST", Date.now() - startTime, 200, session.user.id)
    monitoring.logUserAction(
      "automation_toggled",
      {
        automationId,
        action,
        newStatus,
      },
      session.user.id,
    )

    return NextResponse.json(response)
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/rpa/toggle-automation" })
    monitoring.logApiCall("/api/rpa/toggle-automation", "POST", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
