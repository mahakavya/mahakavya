import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { validateAdmin } from "@/lib/access"

// Reads request.url for query params — export as dynamic to avoid static rendering errors
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

    // Calculate date range
    const now = new Date()
    const daysBack = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch overview statistics
    const [
      totalUsersResult,
      activeUsersResult,
      newUsersResult,
      revenueResult,
      subscriptionsResult,
      engagementResult,
      devicesResult,
      locationsResult,
      blockchainResult,
      rpaResult,
    ] = await Promise.all([
      // Total users
      sb
        .from("profiles")
        .select("id", { count: "exact" }),

      // Active users (logged in within range)
      sb
        .from("profiles")
        .select("id", { count: "exact" })
        .gte("last_sign_in_at", startDate.toISOString()),

      // New users within range
      sb
        .from("profiles")
        .select("id", { count: "exact" })
        .gte("created_at", startDate.toISOString()),

      // Revenue data
      sb
        .from("payments")
        .select("amount, currency")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString()),

      // Active subscriptions
      sb
        .from("subscriptions")
        .select("id", { count: "exact" })
        .eq("status", "active"),

      // Engagement metrics
      sb
        .from("posts")
        .select(`
          id,
          likes:post_likes(count),
          comments:post_comments(count),
          shares:post_shares(count),
          views
        `)
        .gte("created_at", startDate.toISOString()),

      // Device analytics
      sb
        .from("analytics_events")
        .select("device_type")
        .gte("created_at", startDate.toISOString()),

      // Location analytics
      sb
        .from("profiles")
        .select("country")
        .not("country", "is", null),

      // Blockchain metrics
      sb
        .from("blockchain_records")
        .select("id, verification_status")
        .gte("created_at", startDate.toISOString()),

      // RPA job metrics
      sb
        .from("rpa_jobs")
        .select("status")
        .gte("created_at", startDate.toISOString()),
    ])

    // Process results
    const totalUsers: number = (totalUsersResult.count as number) || 0
    const activeUsers: number = (activeUsersResult.count as number) || 0
    const newUsers: number = (newUsersResult.count as number) || 0

    // Calculate revenue
    const revenueRows = (revenueResult.data || []) as any[]
    const totalRevenue: number = revenueRows.reduce((sum: number, payment: any) => {
      return sum + Number(payment?.amount || 0)
    }, 0)

    const subscriptions: number = (subscriptionsResult.count as number) || 0

    // Calculate engagement metrics
    const posts = (engagementResult.data || []) as any[]
    const totalLikes: number = posts.reduce((sum: number, post: any) => sum + (Number(post?.likes?.length) || Number(post?.likes) || 0), 0)
    const totalComments: number = posts.reduce((sum: number, post: any) => sum + (Number(post?.comments?.length) || Number(post?.comments) || 0), 0)
    const totalShares: number = posts.reduce((sum: number, post: any) => sum + (Number(post?.shares?.length) || Number(post?.shares) || 0), 0)
    const totalViews: number = posts.reduce((sum: number, post: any) => sum + Number(post?.views || 0), 0)

    const engagementRate =
      posts.length > 0 ? ((totalLikes + totalComments + totalShares) / (posts.length * totalUsers)) * 100 : 0

    // Process device data
    const deviceData = (devicesResult.data || []).reduce((acc: Record<string, number>, event: any) => {
      const device = event?.device_type || "unknown"
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Process location data
    const locationData = (locationsResult.data || []).reduce((acc: Record<string, number>, profile: any) => {
      const country = profile?.country || "Unknown"
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topLocations = Object.entries(locationData)
      .map(([country, users]) => [country, Number(users)] as [string, number])
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([country, users]) => ({
        country,
        users,
        revenue: Math.round((users / Math.max(1, totalUsers)) * totalRevenue),
      }))

    // Process blockchain data
  const blockchainData = (blockchainResult.data || []) as any[]
  const verifiedContent = blockchainData.filter((r: any) => r?.verification_status === "verified").length
  const securityScore = blockchainData.length > 0 ? Math.round((verifiedContent / blockchainData.length) * 100) : 100

    // Process RPA data
    const rpaData = (rpaResult.data || []).reduce((acc: Record<string, number>, job: any) => {
      const status = job?.status || "unknown"
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const rpaCompleted = rpaData.completed || 0
    const rpaRunning = rpaData.running || 0
    const rpaFailed = rpaData.failed || 0
    const rpaTotal = rpaCompleted + rpaRunning + rpaFailed
    const rpaEfficiency = rpaTotal > 0 ? Math.round((rpaCompleted / rpaTotal) * 100) : 100

    // Calculate additional metrics
    const churnRate = totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0
    const avgSessionDuration = 25 * 60 // Mock: 25 minutes in seconds

    // Generate AI insights
    const aiInsights = {
      userBehaviorScore: Math.min(100, Math.round(engagementRate * 2)),
      contentQualityScore: Math.min(100, Math.round((totalLikes / Math.max(posts.length, 1)) * 5)),
      riskAssessment: churnRate < 5 ? "LOW" : churnRate < 15 ? "MEDIUM" : "HIGH",
      predictions: {
        userGrowth: Math.round(Math.random() * 20 + 5), // Mock prediction
        revenueGrowth: Math.round(Math.random() * 15 + 10),
        churnPrediction: Math.round(churnRate + Math.random() * 5),
      },
      recommendations: [
        "Increase content personalization to boost engagement",
        "Implement retention campaigns for at-risk users",
        "Focus marketing efforts on high-converting locations",
        "Optimize mobile experience based on device usage",
      ].slice(0, Math.floor(Math.random() * 3) + 2),
    }

    const analyticsData = {
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        churnRate: Number.parseFloat(churnRate.toFixed(2)),
        avgSessionDuration,
        totalRevenue,
        subscriptions,
        engagementRate: Number.parseFloat(engagementRate.toFixed(2)),
      },
      engagement: {
        posts: posts.length,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        viewTime: totalViews * 30, // Mock: 30 seconds per view
        bounceRate: Math.random() * 30 + 20, // Mock bounce rate
      },
      devices: {
        mobile: deviceData.mobile || Math.round(totalUsers * 0.7),
        desktop: deviceData.desktop || Math.round(totalUsers * 0.25),
        tablet: deviceData.tablet || Math.round(totalUsers * 0.05),
      },
      locations: topLocations,
      aiInsights,
      blockchainMetrics: {
        totalTransactions: blockchainData.length,
        verifiedContent,
        securityScore,
        integrityChecks: blockchainData.length * 3, // Mock: 3 checks per record
      },
      rpaJobs: {
        completed: rpaCompleted,
        running: rpaRunning,
        failed: rpaFailed,
        efficiency: rpaEfficiency,
      },
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics overview error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
