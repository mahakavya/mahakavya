import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's groups count
    const { count: totalGroups } = await supabase
      .from("group_conversations")
      .select("*", { count: "exact", head: true })
      .eq("group_members.user_id", user.id)

    // Get active groups (with activity in last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { count: activeGroups } = await supabase
      .from("group_conversations")
      .select("*", { count: "exact", head: true })
      .eq("group_members.user_id", user.id)
      .gte("last_activity", yesterday.toISOString())

    // Get total members across all user's groups
    const { data: memberCounts } = await supabase
      .from("group_conversations")
      .select("member_count")
      .eq("group_members.user_id", user.id)

    const totalMembers = memberCounts?.reduce((sum, group) => sum + (group.member_count || 0), 0) || 0

    // Get messages today across user's groups
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: messagesToday } = await supabase
      .from("group_messages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .in(
        "group_id",
        await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .then(({ data }) => data?.map((m) => m.group_id) || []),
      )

    // Get AI insights generated today
    const { count: aiInsights } = await supabase
      .from("ai_group_insights")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .in(
        "group_id",
        await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .then(({ data }) => data?.map((m) => m.group_id) || []),
      )

    // Get blockchain verifications today
    const { count: blockchainVerifications } = await supabase
      .from("blockchain_group_records")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", today.toISOString())
      .in(
        "group_id",
        await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .then(({ data }) => data?.map((m) => m.group_id) || []),
      )

    // Get active RPA automations
    const { count: rpaAutomations } = await supabase
      .from("rpa_group_jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "running")
      .in(
        "group_id",
        await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id)
          .then(({ data }) => data?.map((m) => m.group_id) || []),
      )

    return NextResponse.json({
      total_groups: totalGroups || 0,
      active_groups: activeGroups || 0,
      total_members: totalMembers,
      messages_today: messagesToday || 0,
      ai_insights_generated: aiInsights || 0,
      blockchain_verifications: blockchainVerifications || 0,
      rpa_automations_active: rpaAutomations || 0,
    })
  } catch (error) {
    console.error("Error fetching group stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
