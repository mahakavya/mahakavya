import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", profile.id)
      .single()

    if (subscription?.status !== "active") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
    }

    // Get user's draw history for personalized insights
    const { data: userEntries } = await supabase
      .from("entries")
      .select(`
        draw_id,
        created_at,
        draws!inner(
          status,
          result,
          ticket_price,
          draw_at
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50)

    // Get platform statistics
    const { data: platformStats } = await supabase
      .from("draws")
      .select("status, ticket_price, created_at")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate AI insights
    const totalEntries = userEntries?.length || 0
    const winCount = userEntries?.filter((entry) => entry.draws.result?.winner_user_id === profile.id).length || 0

    const winProbability = totalEntries > 0 ? Math.round((winCount / totalEntries) * 100) : 15

    // Calculate user engagement based on activity
    const recentEntries =
      userEntries?.filter((entry) => new Date(entry.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length || 0

    const userEngagement = Math.min(100, recentEntries * 20)

    // Market trends analysis
    const totalParticipants = await supabase
      .from("entries")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const averageTicketPrice =
      platformStats?.reduce((sum, draw) => sum + (draw.ticket_price || 0), 0) / (platformStats?.length || 1) || 0

    // Generate AI recommendations
    const recommendations = []

    if (winProbability < 20) {
      recommendations.push("Consider entering draws with fewer participants for better odds")
    }

    if (userEngagement < 50) {
      recommendations.push("Increase your activity to improve AI prediction accuracy")
    }

    recommendations.push("Free draws have the same winning algorithm as paid ones")
    recommendations.push("Peak hours (6-9 PM IST) have higher participation rates")

    if (averageTicketPrice > 50) {
      recommendations.push("Lower-priced draws often have better value propositions")
    }

    // Popular draws (mock data - in production, calculate from actual data)
    const popularDraws = ["Weekend Special", "Daily Jackpot", "Free Entry Draw", "Premium Rewards", "Community Choice"]

    const insights = {
      winProbability,
      optimalEntryTime: "6:00 PM - 8:00 PM IST",
      popularDraws,
      userEngagement,
      recommendations,
      marketTrends: {
        totalParticipants: totalParticipants.count || 0,
        averageTicketPrice: Math.round(averageTicketPrice),
        successRate: 85, // Platform success rate
        peakHours: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"],
      },
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
