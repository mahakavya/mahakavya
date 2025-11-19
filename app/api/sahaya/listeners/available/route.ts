import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

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

    // Check premium access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
  const specialization = searchParams.get("specialization")
  const language = searchParams.get("language")

    // Get available listeners with their slots
    let query = supabase
      .from("listeners")
      .select(`
        user_id,
        bio,
        specializations,
        languages,
        rating,
        total_sessions,
        ai_enhanced,
        blockchain_verified,
        premium_tier,
        is_active,
        profiles!listeners_user_id_fkey (
          id,
          name,
          avatar_url
        ),
        slots!slots_listener_id_fkey (
          id,
          start_at,
          end_at,
          is_booked
        )
      `)
      .eq("is_active", true)
      .gte("rating", 3.0)

    if (specialization) {
      query = query.contains("specializations", [specialization])
    }

    if (language) {
      query = query.contains("languages", [language])
    }

    const { data: listeners, error } = await query

    if (error) {
      console.error("Error fetching listeners:", error)
      return NextResponse.json({ error: "Failed to fetch listeners" }, { status: 500 })
    }

    // Filter listeners with available slots and transform data
    const now = new Date()
    const availableListeners = listeners
      ?.filter((listener: any) => {
        const availableSlots = listener.slots?.filter((slot: any) => !slot.is_booked && new Date(slot.start_at) > now)
        return availableSlots && availableSlots.length > 0
      })
      .map((listener: any) => ({
        id: listener.user_id,
        name: listener.profiles?.name || "Anonymous",
        avatar_url: listener.profiles?.avatar_url,
        bio: listener.bio,
        specializations: listener.specializations || listener.expertise || [],
        languages: listener.languages || [],
        rating: listener.rating,
        total_sessions: listener.total_sessions,
        ai_enhanced: listener.ai_enhanced,
        blockchain_verified: listener.blockchain_verified,
        premium_tier: listener.premium_tier,
        available_slots: listener.slots
          ?.filter((slot: any) => !slot.is_booked && new Date(slot.start_at) > now)
          .sort((a: any, b: any) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
          .slice(0, 5), // Limit to next 5 available slots
      }))
      .sort((a: any, b: any) => b.rating - a.rating) // Sort by rating descending

    return NextResponse.json({
      listeners: availableListeners || [],
      total: availableListeners?.length || 0,
    })
  } catch (error) {
    console.error("Available listeners error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
