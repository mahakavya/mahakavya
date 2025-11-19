import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { validateAdmin } from "@/lib/access"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const sb: any = supabase

    // Validate admin access via session user id
    const sessionRes = await sb.auth.getSession()
    const userId = sessionRes?.data?.session?.user?.id
    const adminCheck = await validateAdmin(userId)
    if (!adminCheck.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Fetch real-time metrics
    const [activeUsersResult, newSignupsResult, revenueResult, errorsResult] = await Promise.all([
      // Active users in last hour
      sb
        .from("user_sessions")
        .select("user_id", { count: "exact" })
        .gte("last_activity", oneHourAgo.toISOString())
        .eq("is_active", true),

      // New signups today
      sb
        .from("profiles")
        .select("id", { count: "exact" })
        .gte("created_at", todayStart.toISOString()),

      // Revenue today
      sb
        .from("payments")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", todayStart.toISOString()),

      // Error events in last hour
      sb
        .from("error_logs")
        .select("id", { count: "exact" })
        .gte("created_at", oneHourAgo.toISOString()),
    ])

    // Calculate metrics
  const activeUsers = (activeUsersResult as any).count || 0
  const newSignups = (newSignupsResult as any).count || 0
  const revenue = ((revenueResult as any).data || []).reduce((sum: number, payment: any) => sum + (payment?.amount || 0), 0)
  const errors = (errorsResult as any).count || 0

    const realtimeMetrics = {
      timestamp: now.toISOString(),
      activeUsers,
      newSignups,
      revenue,
      errors,
    }

    return NextResponse.json(realtimeMetrics)
  } catch (error) {
    console.error("Real-time analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch real-time data" }, { status: 500 })
  }
}
