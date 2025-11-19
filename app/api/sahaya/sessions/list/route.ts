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
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query for sessions where user is either seeker or listener
    let query = supabase
      .from("sessions")
      .select(`
        id,
        status,
        scheduled_at,
        duration,
        session_type,
        ai_enhanced,
        blockchain_verified,
        created_at,
        listener:profiles!sessions_listener_id_fkey (
          id,
          name,
          avatar_url
        ),
        seeker:profiles!sessions_seeker_id_fkey (
          id,
          name,
          avatar_url
        ),
        listener_details:listeners!sessions_listener_id_fkey (
          specializations,
          rating
        )
      `)
      .or(`seeker_id.eq.${session.user.id},listener_id.eq.${session.user.id}`)
      .order("scheduled_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (type && type !== "all") {
      query = query.eq("session_type", type)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching sessions:", error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedSessions =
      sessions?.map((session: any) => ({
        id: session.id,
        status: session.status,
        scheduled_at: session.scheduled_at,
        duration: session.duration,
        session_type: session.session_type,
        ai_enhanced: session.ai_enhanced,
        blockchain_verified: session.blockchain_verified,
        created_at: session.created_at,
        listener: {
          id: session.listener?.id,
          name: session.listener?.name,
          avatar_url: session.listener?.avatar_url,
          specializations: session.listener_details?.specializations || [],
          rating: session.listener_details?.rating || 0,
        },
        seeker: {
          id: session.seeker?.id,
          name: session.seeker?.name,
          avatar_url: session.seeker?.avatar_url,
        },
      })) || []

    return NextResponse.json({
      sessions: transformedSessions,
      hasMore: sessions?.length === limit,
    })
  } catch (error) {
    console.error("Sessions list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
