import { type NextRequest, NextResponse } from "next/server"
// Uses cookies and server auth helpers — force dynamic
export const dynamic = 'force-dynamic'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { logger } from "@/lib/log"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Verify admin access
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || !["ADMIN", "SUPER_ADMIN", "MASTER_ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get today's date
    const today = new Date().toISOString().split("T")[0]

    // Fetch metrics in parallel
    const [dauResult, signupsResult, premiumResult, flagsResult, fundraisersResult] = await Promise.all([
      // DAU today
      supabase
        .from("daily_usage")
        .select("dau")
        .eq("usage_date", today)
        .single(),

      // New signups today
      supabase
        .from("daily_usage")
        .select("new_signups")
        .eq("usage_date", today)
        .single(),

      // Active premium subscriptions
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact" })
        .eq("status", "ACTIVE"),

      // Open moderation flags
      supabase
        .from("moderation_flags")
        .select("id", { count: "exact" })
        .eq("status", "PENDING"),

      // Active fundraisers
      supabase
        .from("fundraisers")
        .select("id", { count: "exact" })
        .eq("status", "ACTIVE"),
    ])

    const metrics = {
      dau_today: dauResult.data?.dau || 0,
      new_signups_today: signupsResult.data?.new_signups || 0,
      premium_active: premiumResult.count || 0,
      total_revenue_est: (premiumResult.count || 0) * 499, // ₹499 per month
      open_flags: flagsResult.count || 0,
      active_fundraisers: fundraisersResult.count || 0,
    }

  logger.info("Admin metrics fetched", ({ userId: session.user.id, metrics } as any))

    return NextResponse.json(metrics)
  } catch (error) {
    logger.error("Failed to fetch admin metrics", error as Error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
