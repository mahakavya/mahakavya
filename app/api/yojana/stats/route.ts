import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Get total users count
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Get most popular plan
    const { data: planStats } = await supabase.from("subscriptions").select("plan_id").eq("status", "active")

    const planCounts =
      planStats?.reduce((acc: Record<string, number>, sub) => {
        acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1
        return acc
      }, {}) || {}

    const popularPlan =
      Object.entries(planCounts).reduce((a, b) => (planCounts[a[0]] > planCounts[b[0]] ? a : b))?.[0] || "monthly"

    // Calculate satisfaction rate (mock data for now)
    const satisfactionRate = 0.94 // 94% satisfaction

    const stats = {
      total_users: totalUsers || 0,
      active_subscriptions: activeSubscriptions || 0,
      popular_plan: popularPlan === "monthly" ? "Sampurna" : "Prarambha",
      satisfaction_rate: satisfactionRate,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Subscription stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
