import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { SlotCreateSchema, SlotsQuerySchema } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const queryData = {
      listener_id: searchParams.get("listenerId") || searchParams.get("listener_id"),
      date: searchParams.get("from") || searchParams.get("date"),
    }

    const validatedQuery = SlotsQuerySchema.parse(queryData) as any

    const { data: slots, error } = await supabase
      .from("slots")
      .select("*")
  .eq("listener_id", validatedQuery.listener_id)
  .gte("start_at", validatedQuery.date)
  .lte("end_at", validatedQuery.date)
      .order("start_at", { ascending: true })

    if (error) {
      console.error("Error fetching slots:", error)
      return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
    }

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("Slots GET error:", error)
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

    // Verify user is a listener
    const { data: listener } = await supabase
      .from("listeners")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single()

    if (!listener) {
      return NextResponse.json({ error: "You must be a registered listener" }, { status: 403 })
    }

    const body = await request.json()
  const validatedData = SlotCreateSchema.parse(body) as any

  // Validate slot duration (15 minutes to 2 hours)
  // validators use start_time/end_time names
  const startTime = new Date(validatedData.start_time || validatedData.startAt)
  const endTime = new Date(validatedData.end_time || validatedData.endAt)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = durationMs / (1000 * 60)

    if (durationMinutes < 15) {
      return NextResponse.json({ error: "Minimum slot duration is 15 minutes" }, { status: 400 })
    }

    if (durationMinutes > 120) {
      return NextResponse.json({ error: "Maximum slot duration is 2 hours" }, { status: 400 })
    }

    if (startTime <= new Date()) {
      return NextResponse.json({ error: "Slot must be in the future" }, { status: 400 })
    }

    // Create slot
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .insert({
        listener_id: session.user.id,
  start_at: validatedData.start_time || validatedData.startAt,
  end_at: validatedData.end_time || validatedData.endAt,
        is_booked: false,
      })
      .select()
      .single()

    if (slotError) {
      if (slotError.message.includes("overlaps")) {
        return NextResponse.json({ error: "Slot overlaps with existing slot" }, { status: 400 })
      }
      console.error("Error creating slot:", slotError)
      return NextResponse.json({ error: "Failed to create slot" }, { status: 500 })
    }

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    console.error("Slots POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
