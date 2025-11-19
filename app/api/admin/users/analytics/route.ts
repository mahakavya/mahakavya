import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    // Get user analytics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: newUsersToday },
      { count: suspendedUsers },
      { count: bannedUsers },
      { count: verifiedUsers },
      { count: premiumUsers },
      { count: highRiskUsers },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "suspended"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "banned"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", true),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("subscription_status", "premium"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("ai_risk_score", 70),
    ])

    // Get average engagement and reputation
    const { data: avgData } = await supabase
      .from("profiles")
      .select("engagement_rate, reputation_score")
      .not("engagement_rate", "is", null)
      .not("reputation_score", "is", null)

    const avgEngagement =
      avgData?.reduce((sum, user) => sum + (user.engagement_rate || 0), 0) / (avgData?.length || 1) || 0
    const avgReputation =
      avgData?.reduce((sum, user) => sum + (user.reputation_score || 0), 0) / (avgData?.length || 1) || 0

    return NextResponse.json({
      success: true,
      data: {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        new_users_today: newUsersToday || 0,
        suspended_users: suspendedUsers || 0,
        banned_users: bannedUsers || 0,
        verified_users: verifiedUsers || 0,
        premium_users: premiumUsers || 0,
        high_risk_users: highRiskUsers || 0,
        avg_engagement: avgEngagement,
        avg_reputation: avgReputation,
      },
    })
  } catch (error) {
    console.error("Error in admin users analytics GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
