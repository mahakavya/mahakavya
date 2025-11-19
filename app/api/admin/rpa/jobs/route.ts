import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Mock RPA jobs data
    const jobs = Array.from({ length: limit }, (_, i) => ({
      id: `rpa_job_${i + 1}`,
      name: `${["Data Migration", "Bulk Moderation", "User Onboarding", "System Maintenance"][i % 4]} Job #${i + 1}`,
      type: ["data_migration", "bulk_moderation", "user_onboarding", "system_maintenance"][i % 4],
      status: ["scheduled", "running", "completed", "failed"][Math.floor(Math.random() * 4)],
      progress: Math.floor(Math.random() * 100),
      scheduledAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
      startedAt:
        Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : undefined,
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      results:
        Math.random() > 0.5
          ? {
              itemsProcessed: Math.floor(Math.random() * 5000) + 1000,
              successCount: Math.floor(Math.random() * 4500) + 900,
              errorCount: Math.floor(Math.random() * 100) + 10,
              timeSaved: `${Math.floor(Math.random() * 10) + 2} hours`,
            }
          : undefined,
    }))

    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    console.error("RPA jobs fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const { type } = await request.json()

    if (!["data_migration", "bulk_moderation", "user_onboarding", "system_maintenance"].includes(type)) {
      return NextResponse.json({ error: "Invalid job type" }, { status: 400 })
    }

    // Create new RPA job
    const jobId = `rpa_job_${Date.now()}`

    // In a real implementation, this would queue the job in an RPA system
    // For now, we'll just simulate starting the job

    return NextResponse.json({
      success: true,
      message: "RPA job started successfully",
      jobId,
    })
  } catch (error) {
    console.error("RPA job start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
