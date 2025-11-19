import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user owns the campaign
    const { data: campaign } = await supabase.from("campaigns").select("owner_id").eq("id", params.id).single()

    if (!campaign || campaign.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Campaign not found or access denied" }, { status: 404 })
    }

    const url = new URL(request.url)
    const range = url.searchParams.get("range") || "7d"

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (range) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24)
        break
      case "7d":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(startDate.getDate() - 30)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Fetch analytics data
    const [viewsResult, sharesResult, donationsResult] = await Promise.all([
      supabase
        .from("campaign_views")
        .select("*")
        .eq("campaign_id", params.id)
        .gte("viewed_at", startDate.toISOString()),
      supabase
        .from("campaign_shares")
        .select("*")
        .eq("campaign_id", params.id)
        .gte("shared_at", startDate.toISOString()),
      supabase
        .from("donations")
        .select("*")
        .eq("campaign_id", params.id)
        .eq("status", "captured")
        .gte("created_at", startDate.toISOString()),
    ])

    const views = viewsResult.data || []
    const shares = sharesResult.data || []
    const donations = donationsResult.data || []

    // Calculate overview metrics
    const totalViews = views.length
    const totalShares = shares.length
    const totalDonations = donations.length
    const conversionRate = totalViews > 0 ? totalDonations / totalViews : 0
    const avgDonation = totalDonations > 0 ? donations.reduce((sum, d) => sum + d.amount, 0) / totalDonations : 0

    // Get top referrer
    const referrers = views.reduce((acc: Record<string, number>, view) => {
      const referrer = view.referrer_url || "Direct"
      acc[referrer] = (acc[referrer] || 0) + 1
      return acc
    }, {})
    const topReferrer = Object.keys(referrers).reduce((a, b) => (referrers[a] > referrers[b] ? a : b), "Direct")

    // Generate timeline data
    const timeline = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayViews = views.filter((v) => v.viewed_at.startsWith(dateStr)).length
      const dayDonations = donations.filter((d) => d.created_at.startsWith(dateStr)).length
      const dayAmount = donations.filter((d) => d.created_at.startsWith(dateStr)).reduce((sum, d) => sum + d.amount, 0)

      timeline.push({
        date: dateStr,
        views: dayViews,
        donations: dayDonations,
        amount: dayAmount,
      })
    }

    // Demographics data (mock for now - in real app, would analyze actual data)
    const demographics = {
      ageGroups: [
        { name: "18-24", value: Math.floor(totalViews * 0.2) },
        { name: "25-34", value: Math.floor(totalViews * 0.35) },
        { name: "35-44", value: Math.floor(totalViews * 0.25) },
        { name: "45-54", value: Math.floor(totalViews * 0.15) },
        { name: "55+", value: Math.floor(totalViews * 0.05) },
      ],
      locations: [
        { name: "Mumbai", value: Math.floor(totalViews * 0.3) },
        { name: "Delhi", value: Math.floor(totalViews * 0.25) },
        { name: "Bangalore", value: Math.floor(totalViews * 0.2) },
        { name: "Chennai", value: Math.floor(totalViews * 0.15) },
        { name: "Others", value: Math.floor(totalViews * 0.1) },
      ],
      sources: [
        { name: "Direct", value: Math.floor(totalViews * 0.4) },
        { name: "Social Media", value: Math.floor(totalViews * 0.3) },
        { name: "Email", value: Math.floor(totalViews * 0.2) },
        { name: "Search", value: Math.floor(totalViews * 0.1) },
      ],
    }

    // Performance metrics
    const performance = {
      engagementRate: totalViews > 0 ? (totalShares + totalDonations) / totalViews : 0,
      shareRate: totalViews > 0 ? totalShares / totalViews : 0,
      returnVisitorRate: 0.25, // Mock data
      avgSessionDuration: 180, // Mock data in seconds
    }

    const analytics = {
      overview: {
        totalViews,
        totalShares,
        totalDonations,
        conversionRate,
        avgDonation,
        topReferrer,
      },
      timeline,
      demographics,
      performance,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
