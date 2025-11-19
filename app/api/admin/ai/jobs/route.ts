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

    // Mock AI jobs data
    const jobs = Array.from({ length: limit }, (_, i) => ({
      id: `ai_job_${i + 1}`,
      type: ["content_analysis", "user_behavior", "trend_detection", "risk_assessment"][i % 4],
      status: ["queued", "running", "completed", "failed"][Math.floor(Math.random() * 4)],
      progress: Math.floor(Math.random() * 100),
      startedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      results:
        Math.random() > 0.5
          ? {
              processed: Math.floor(Math.random() * 1000) + 100,
              flagged: Math.floor(Math.random() * 50),
              approved: Math.floor(Math.random() * 800) + 200,
              rejected: Math.floor(Math.random() * 100) + 20,
            }
          : undefined,
    }))

    return NextResponse.json({ success: true, data: jobs })
  } catch (error) {
    console.error("AI jobs fetch error:", error)
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

    if (!["content_analysis", "user_behavior", "trend_detection", "risk_assessment"].includes(type)) {
      return NextResponse.json({ error: "Invalid job type" }, { status: 400 })
    }

    // Create new AI job
    const jobId = `ai_job_${Date.now()}`

    // In a real implementation, this would queue the job in a job processing system
    // For now, we'll just simulate starting the job

    return NextResponse.json({
      success: true,
      message: "AI job started successfully",
      jobId,
    })
  } catch (error) {
    console.error("AI job start error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
