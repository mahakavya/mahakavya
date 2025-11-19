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

    // Get session statistics
    const { data: sessionStats, error: statsError } = await supabase
      .from("sessions")
      .select("status, duration, created_at")
      .or(`seeker_id.eq.${session.user.id},listener_id.eq.${session.user.id}`)

    if (statsError) {
      console.error("Error fetching session stats:", statsError)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    const stats = {
      total: sessionStats?.length || 0,
      scheduled: sessionStats?.filter((s: any) => s.status === "scheduled").length || 0,
      completed: sessionStats?.filter((s: any) => s.status === "completed").length || 0,
      cancelled: sessionStats?.filter((s: any) => s.status === "cancelled").length || 0,
      averageRating: 4.2, // This would come from a ratings table
      totalHours: sessionStats?.reduce((total: number, s: any) => total + (s.duration || 0), 0) / 60 || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Session stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
