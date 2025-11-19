import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId } = body

    // Create AI optimization job
    const { data: aiJob, error: jobError } = await supabase
      .from("rpa_jobs")
      .insert({
        user_id: userId,
        service: "sahaya",
        job_type: "ai_optimization",
        status: "running",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError) {
      console.error("Error creating AI job:", jobError)
      return NextResponse.json({ error: "Failed to start optimization" }, { status: 500 })
    }

    // Simulate AI optimization process
    setTimeout(async () => {
      await supabase
        .from("rpa_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", aiJob.id)
    }, 3000)

    // Log blockchain transaction for AI optimization
    await supabase.from("blockchain_transactions").insert({
      user_id: userId,
      service: "sahaya",
      transaction_type: "ai_optimization",
      transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "confirmed",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, jobId: aiJob.id })
  } catch (error) {
    console.error("AI optimize error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
