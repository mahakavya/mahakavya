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

    // Get total sessions count
    const { count: totalSessions } = await supabase.from("sessions").select("*", { count: "exact", head: true })

    // Get active sessions count
    const { count: activeSessions } = await supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")

    // Calculate average rating
    const { data: ratingsData } = await supabase
      .from("sessions")
      .select("feedback_rating")
      .not("feedback_rating", "is", null)

    const averageRating =
      ratingsData && ratingsData.length > 0
        ? ratingsData.reduce((sum: number, session: any) => sum + (session.feedback_rating || 0), 0) / ratingsData.length
        : 4.5

    // Calculate average response time (simulated)
    const responseTime = 12 // Average 12 minutes

    const stats = {
      totalSessions: totalSessions || 0,
      activeSessions: activeSessions || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      responseTime,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
