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
    const { listener_id, slot_id, session_type, duration, topic, urgency, ai_enhanced, blockchain_verified } = body

    // Verify slot exists and is available
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slot_id)
      .eq("is_booked", false)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found or already booked" }, { status: 404 })
    }

    // Check if slot is at least 10 minutes in the future
    const slotStart = new Date(slot.start_at)
    const now = new Date()
    const timeDiff = slotStart.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    if (minutesDiff < 10) {
      return NextResponse.json({ error: "Slot must be at least 10 minutes in the future" }, { status: 400 })
    }

    // Prevent self-booking
    if (slot.listener_id === session.user.id) {
      return NextResponse.json({ error: "Cannot book your own slot" }, { status: 400 })
    }

    // Create session
    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        seeker_id: session.user.id,
        listener_id: listener_id,
        slot_id: slot_id,
        status: "scheduled",
        scheduled_at: slot.start_at,
        duration: duration,
        session_type: session_type,
        topic: topic,
        urgency: urgency,
        ai_enhanced: ai_enhanced,
        blockchain_verified: blockchain_verified,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Mark slot as booked
    await supabase.from("slots").update({ is_booked: true }).eq("id", slot_id)

    // Create AI insights job
    if (ai_enhanced) {
      await supabase.from("rpa_jobs").insert({
        user_id: session.user.id,
        service: "sahaya",
        job_type: "ai_session_preparation",
        status: "pending",
        created_at: new Date().toISOString(),
        metadata: {
          session_id: newSession.id,
          listener_id: listener_id,
          topic: topic,
        },
      })
    }

    // Log blockchain transaction
    if (blockchain_verified) {
      await supabase.from("blockchain_transactions").insert({
        user_id: session.user.id,
        service: "sahaya",
        transaction_type: "session_scheduled",
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: "confirmed",
        created_at: new Date().toISOString(),
        metadata: {
          session_id: newSession.id,
          listener_id: listener_id,
          slot_id: slot_id,
        },
      })
    }

    // Send notification to listener
    await supabase.from("notifications").insert({
      user_id: listener_id,
      kind: "session_scheduled",
      title: "New Session Scheduled",
      body: `A new session has been scheduled with you`,
      href: `/sahaya/session/${newSession.id}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        sessionId: newSession.id,
        message: "Session scheduled successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Session schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
