import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { SessionRequestSchema, SessionsQuerySchema } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
    status: searchParams.get("status"),
    page: searchParams.get("cursor") || searchParams.get("page"),
    limit: searchParams.get("limit"),
    }

  const validatedQuery = SessionsQuerySchema.parse(queryData) as any

    // Build query for sessions where user is either seeker or listener
    let query = supabase
      .from("sessions")
      .select(`
        id,
        status,
        created_at,
        slots!sessions_slot_id_fkey (
          start_at,
          end_at,
          listener_id
        ),
        listener:profiles!sessions_listener_id_fkey (
          id,
          name,
          avatar_url
        ),
        seeker:profiles!sessions_seeker_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .or(`seeker_id.eq.${session.user.id},listener_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false })
      .limit(validatedQuery.limit)

    if (validatedQuery.status) {
      query = query.eq("status", validatedQuery.status)
    }

    if (validatedQuery.cursor) {
      query = query.lt("created_at", validatedQuery.cursor)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching sessions:", error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }

  const nextCursor = sessions.length === validatedQuery.limit ? sessions[sessions.length - 1]?.created_at : null

    return NextResponse.json({
      sessions,
      nextCursor,
    })
  } catch (error) {
    console.error("Sessions GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Check access (intro used or subscription active)
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Access denied. Please purchase intro access or subscribe." }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = SessionRequestSchema.parse(body)

    // Verify slot exists and is available
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", validatedData.slotId)
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

    // Create session and mark slot as booked in a transaction
    const { data: newSession, error: sessionError } = await supabase.rpc("create_session_and_book_slot", {
      p_slot_id: validatedData.slotId,
      p_seeker_id: session.user.id,
      p_listener_id: slot.listener_id,
      p_note: validatedData.note,
    })

    if (sessionError) {
      console.error("Error creating session:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ sessionId: newSession }, { status: 201 })
  } catch (error) {
    console.error("Sessions POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
