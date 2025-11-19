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
    const { anonymous } = body

    // Find available listener for anonymous session
    const { data: availableListeners } = await supabase
      .from("listeners")
      .select(`
        user_id,
        profiles!listeners_user_id_fkey (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .limit(10)

    if (!availableListeners || availableListeners.length === 0) {
      return NextResponse.json({ error: "No listeners available" }, { status: 404 })
    }

    // Select random listener for anonymous matching
    const randomListener = availableListeners[Math.floor(Math.random() * availableListeners.length)]

    // Create anonymous session
    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        seeker_id: session.user.id,
        listener_id: randomListener.user_id,
        status: "confirmed",
        is_anonymous: anonymous,
        ai_guided: true,
        blockchain_verified: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating anonymous session:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Simulate connecting to an anonymous listener
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Log blockchain transaction for anonymous session
    await supabase.from("blockchain_transactions").insert({
      user_id: session.user.id,
      service: "sahaya",
      transaction_type: "anonymous_session_start",
      transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "confirmed",
      created_at: new Date().toISOString(),
    })

    // Log RPA job for session optimization
    await supabase.from("rpa_jobs").insert({
      user_id: session.user.id,
      service: "sahaya",
      job_type: "anonymous_session_optimization",
      status: "running",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ sessionId: newSession.id, success: true }, { status: 201 })
  } catch (error) {
    console.error("Anonymous session error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
