import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { SessionStatusSchema } from "@/lib/validators"

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

    const body = await request.json()
  const validatedData = SessionStatusSchema.parse(body) as any

    // Fetch session with slot info
    const { data: sessionData, error: fetchError } = await supabase
      .from("sessions")
      .select(`
        *,
        slots!sessions_slot_id_fkey (
          start_at,
          end_at
        )
      `)
  .eq("id", validatedData.session_id || validatedData.sessionId)
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
    const slotStart = new Date(sessionData.slots.start_at)
    const slotEnd = new Date(sessionData.slots.end_at)

    const updateData: any = {}
    let shouldUnbookSlot = false

  switch (validatedData.action) {
      case "confirm":
        if (!isListener) {
          return NextResponse.json({ error: "Only listener can confirm sessions" }, { status: 403 })
        }
        if (sessionData.status !== "requested") {
          return NextResponse.json({ error: "Can only confirm requested sessions" }, { status: 400 })
        }
        updateData.status = "confirmed"
        break

      case "complete":
        if (now < slotEnd) {
          return NextResponse.json({ error: "Can only complete sessions after end time" }, { status: 400 })
        }
        if (!["confirmed", "requested"].includes(sessionData.status)) {
          return NextResponse.json({ error: "Cannot complete this session" }, { status: 400 })
        }
        updateData.status = "completed"
        break

      case "cancel":
        if (now >= slotStart) {
          return NextResponse.json({ error: "Cannot cancel sessions after start time" }, { status: 400 })
        }
        if (sessionData.status === "completed") {
          return NextResponse.json({ error: "Cannot cancel completed sessions" }, { status: 400 })
        }
        updateData.status = "canceled"
        shouldUnbookSlot = true
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update session status
  const { error: updateError } = await supabase.from("sessions").update(updateData).eq("id", validatedData.session_id || validatedData.sessionId)

    if (updateError) {
      console.error("Error updating session:", updateError)
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }

    // Unbook slot if canceled
    if (shouldUnbookSlot && sessionData.slot_id) {
      await supabase.from("slots").update({ is_booked: false }).eq("id", sessionData.slot_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
