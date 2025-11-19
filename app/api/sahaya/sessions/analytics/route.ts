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
    const userId = searchParams.get("userId") || session.user.id

    // Get session data for analytics
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select(`
        *,
        listener_details:listeners!sessions_listener_id_fkey (
          specializations,
          rating
        )
      `)
      .or(`seeker_id.eq.${userId},listener_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Error fetching sessions for analytics:", sessionsError)
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
    }

    const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter((s: any) => s.status === "completed").length || 0
  const totalHours = sessions?.reduce((total: number, s: any) => total + (s.duration || 0), 0) / 60 || 0

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      const monthSessions =
        sessions?.filter((s: any) => {
          const sessionDate = new Date(s.created_at)
          return (
            sessionDate.getMonth() === monthDate.getMonth() && sessionDate.getFullYear() === monthDate.getFullYear()
          )
        }) || []

      monthlyTrend.push({
        month: monthName,
        sessions: monthSessions.length,
  hours: monthSessions.reduce((total: number, s: any) => total + (s.duration || 0), 0) / 60,
      })
    }

    // Calculate top specializations
    const specializationCounts: { [key: string]: number } = {}
    sessions?.forEach((session: any) => {
      if (session.listener_details?.specializations) {
        session.listener_details.specializations.forEach((spec: string) => {
          specializationCounts[spec] = (specializationCounts[spec] || 0) + 1
        })
      }
    })

    const topSpecializations = Object.entries(specializationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalSessions) * 100),
      }))

    // Calculate session types
    const sessionTypes = {
  video: sessions?.filter((s: any) => s.session_type === "video").length || 0,
  audio: sessions?.filter((s: any) => s.session_type === "audio").length || 0,
  chat: sessions?.filter((s: any) => s.session_type === "chat").length || 0,
    }

    // Calculate average rating (mock data for now)
    const averageRating = 4.3

    // Calculate satisfaction score
    const satisfactionScore = Math.round((completedSessions / Math.max(totalSessions, 1)) * 100)

    // Generate improvement areas based on data
    const improvementAreas = []
    if (satisfactionScore < 80) {
      improvementAreas.push("Consider scheduling sessions with higher-rated listeners")
    }
    if (sessionTypes.video < totalSessions * 0.3) {
      improvementAreas.push("Try video sessions for more engaging conversations")
    }
    if (totalHours < 10) {
      improvementAreas.push("Regular sessions can help build better therapeutic relationships")
    }

    // Generate achievements
    const achievements = [
      {
        name: "First Session",
        description: "Complete your first session",
        earned: completedSessions >= 1,
      },
      {
        name: "Regular User",
        description: "Complete 5 sessions",
        earned: completedSessions >= 5,
      },
      {
        name: "Dedicated Seeker",
        description: "Complete 10 sessions",
        earned: completedSessions >= 10,
      },
      {
        name: "Video Enthusiast",
        description: "Complete 5 video sessions",
        earned: sessionTypes.video >= 5,
      },
      {
        name: "Well-Rounded",
        description: "Try all session types",
        earned: sessionTypes.video > 0 && sessionTypes.audio > 0 && sessionTypes.chat > 0,
      },
      {
        name: "Marathon Talker",
        description: "Accumulate 20+ hours of sessions",
        earned: totalHours >= 20,
      },
    ]

    const analyticsData = {
      totalSessions,
      completedSessions,
      averageRating,
      totalHours: Math.round(totalHours * 10) / 10,
      monthlyTrend,
      topSpecializations,
      sessionTypes,
      satisfactionScore,
      improvementAreas,
      achievements,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Session analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
