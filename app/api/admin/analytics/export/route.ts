import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { validateAdmin } from "@/lib/access"

// Uses request.url to parse query params for range/format — mark dynamic to avoid static export
export const dynamic = 'force-dynamic'

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

    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"
    const format = searchParams.get("format") || "csv"

    // Calculate date range
    const now = new Date()
    const daysBack = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch comprehensive analytics data
    const [usersResult, postsResult, engagementResult, paymentsResult, sessionsResult] = await Promise.all([
      sb
        .from("profiles")
        .select("id, created_at, last_sign_in_at, country, subscription_status")
        .gte("created_at", startDate.toISOString()),

      sb
        .from("posts")
        .select("id, created_at, user_id, content_type, views, safety_score")
        .gte("created_at", startDate.toISOString()),

  sb.from("post_likes").select("id, created_at, post_id, user_id").gte("created_at", startDate.toISOString()),

      sb
        .from("payments")
        .select("id, created_at, amount, currency, status, user_id")
        .gte("created_at", startDate.toISOString()),

      sb
        .from("analytics_events")
        .select("id, created_at, event_type, user_id, device_type, session_duration")
        .gte("created_at", startDate.toISOString()),
    ])

    if (format === "csv") {
      // Typed daily stats
      type DailyStat = {
        newUsers: number
        activeUsers: number
        posts: number
        engagement: number
        revenue: number
        sessions: number
        totalDuration: number
      }

      const dailyStats = new Map<string, DailyStat>()

      const ensureDate = (date: string) => {
        if (!dailyStats.has(date)) {
          dailyStats.set(date, {
            newUsers: 0,
            activeUsers: 0,
            posts: 0,
            engagement: 0,
            revenue: 0,
            sessions: 0,
            totalDuration: 0,
          })
        }
      }

      // Aggregate rows
  ;((usersResult as any).data || []).forEach((user: any) => {
        const date = (user?.created_at || "").split("T")[0]
        if (!date) return
        ensureDate(date)
        const s = dailyStats.get(date)!
        s.newUsers++
        if (user.last_sign_in_at && new Date(user.last_sign_in_at) >= startDate) s.activeUsers++
      })

  ;((postsResult as any).data || []).forEach((post: any) => {
        const date = (post?.created_at || "").split("T")[0]
        if (!date) return
        ensureDate(date)
        dailyStats.get(date)!.posts++
      })

  ;((engagementResult as any).data || []).forEach((like: any) => {
        const date = (like?.created_at || "").split("T")[0]
        if (!date) return
        ensureDate(date)
        dailyStats.get(date)!.engagement++
      })

  ;((paymentsResult as any).data || []).forEach((payment: any) => {
        const date = (payment?.created_at || "").split("T")[0]
        if (!date) return
        ensureDate(date)
        dailyStats.get(date)!.revenue += Number(payment.amount || 0)
      })

  ;((sessionsResult as any).data || []).forEach((session: any) => {
        const date = (session?.created_at || "").split("T")[0]
        if (!date) return
        ensureDate(date)
        const s = dailyStats.get(date)!
        s.sessions++
        s.totalDuration += Number(session.session_duration || 0)
      })

      // Build CSV
            const csvData = []
      csvData.push([
        "Date",
        "New Users",
        "Active Users",
        "Posts Created",
        "Total Engagement",
        "Revenue",
        "Sessions",
        "Avg Session Duration",
      ].join(","))

      const sortedDates = Array.from(dailyStats.keys()).sort()
      sortedDates.forEach((date) => {
        const stats = dailyStats.get(date)!
        const avgDuration = stats.sessions > 0 ? Math.round(stats.totalDuration / stats.sessions) : 0
        csvData.push([
          date,
          stats.newUsers,
          stats.activeUsers,
          stats.posts,
          stats.engagement,
          stats.revenue.toFixed(2),
          stats.sessions,
          avgDuration,
        ].join(","))
      })

      const csvContent = csvData.join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-${range}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    // If not csv, fallthrough to JSON export below
    const analyticsResult = {
      users: (usersResult.data || []).length,
      posts: (postsResult.data || []).length,
      likes: (engagementResult.data || []).length,
      payments: (paymentsResult.data || []).length,
      sessions: (sessionsResult.data || []).length,
    }

    return NextResponse.json(analyticsResult)
  } catch (error) {
    console.error("Analytics export error:", error)
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 })
  }
  }
