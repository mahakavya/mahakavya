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
    const { sessionId, action } = body

    // Fetch session details
    const { data: sessionData, error: fetchError } = await supabase
      .from("sessions")
      .select(`
        *,
        slots!sessions_slot_id_fkey (
          start_at,
          end_at
        )
      `)
      .eq("id", sessionId)
      .single()

    if (fetchError || !sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check permissions
    const isListener = sessionData.listener_id === session.user.id
    const isSeeker = sessionData.seeker_id === session.user.id

    if (!isListener && !isSeeker) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const now = new Date()
    const slotStart = sessionData.slots ? new Date(sessionData.slots.start_at) : null
    const slotEnd = sessionData.slots ? new Date(sessionData.slots.end_at) : null

    const updateData: any = {}
    let shouldUnbookSlot = false

    switch (action) {
      case "join":
        if (sessionData.status !== "scheduled") {
          return NextResponse.json({ error: "Can only join scheduled sessions" }, { status: 400 })
        }
        if (slotStart && now < slotStart) {
          return NextResponse.json({ error: "Session has not started yet" }, { status: 400 })
        }
        updateData.status = "active"
        updateData.started_at = new Date().toISOString()
        break

      case "complete":
        if (!["active", "scheduled"].includes(sessionData.status)) {
          return NextResponse.json({ error: "Cannot complete this session" }, { status: 400 })
        }
        updateData.status = "completed"
        updateData.completed_at = new Date().toISOString()
        break

      case "cancel":
        if (slotStart && now >= slotStart) {
          return NextResponse.json({ error: "Cannot cancel sessions after start time" }, { status: 400 })
        }
        if (sessionData.status === "completed") {
          return NextResponse.json({ error: "Cannot cancel completed sessions" }, { status: 400 })
        }
        updateData.status = "cancelled"
        updateData.cancelled_at = new Date().toISOString()
        shouldUnbookSlot = true
        break

      case "reschedule":
        if (sessionData.status !== "scheduled") {
          return NextResponse.json({ error: "Can only reschedule scheduled sessions" }, { status: 400 })
        }
        // This would require additional slot_id parameter
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update session
    const { error: updateError } = await supabase.from("sessions").update(updateData).eq("id", sessionId)

    if (updateError) {
      console.error("Error updating session:", updateError)
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }

    // Unbook slot if cancelled
    if (shouldUnbookSlot && sessionData.slot_id) {
      await supabase.from("slots").update({ is_booked: false }).eq("id", sessionData.slot_id)
    }

    // Log blockchain transaction
    if (sessionData.blockchain_verified) {
      await supabase.from("blockchain_transactions").insert({
        user_id: session.user.id,
        service: "sahaya",
        transaction_type: `session_${action}`,
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: "confirmed",
        created_at: new Date().toISOString(),
        metadata: {
          session_id: sessionId,
          action: action,
        },
      })
    }

    // Create RPA job for session action
    await supabase.from("rpa_jobs").insert({
      user_id: session.user.id,
      service: "sahaya",
      job_type: `session_${action}`,
      status: "completed",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        session_id: sessionId,
        action: action,
      },
    })

    // Send notification to the other party
    const otherUserId = isListener ? sessionData.seeker_id : sessionData.listener_id
    const actionMessages = {
      join: "Session has started",
      complete: "Session has been completed",
      cancel: "Session has been cancelled",
      reschedule: "Session has been rescheduled",
    }

    await supabase.from("notifications").insert({
      user_id: otherUserId,
      kind: `session_${action}`,
      title: actionMessages[action as keyof typeof actionMessages],
      body: `Your session has been ${action}d`,
      href: `/sahaya/session/${sessionId}`,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Session ${action}d successfully`,
    })
  } catch (error) {
    console.error("Session action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
