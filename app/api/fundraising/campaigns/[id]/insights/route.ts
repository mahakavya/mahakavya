import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()

    // Get campaign data
    const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", params.id).single()

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get campaign statistics
    const [viewsResult, sharesResult, donationsResult] = await Promise.all([
      supabase.from("campaign_views").select("id", { count: "exact" }).eq("campaign_id", params.id),
      supabase.from("campaign_shares").select("id", { count: "exact" }).eq("campaign_id", params.id),
      supabase.from("donations").select("amount").eq("campaign_id", params.id).eq("status", "captured"),
    ])

    const views = viewsResult.count || 0
    const shares = sharesResult.count || 0
    const donations = donationsResult.data || []
    const totalDonations = donations.length
    const avgDonation = totalDonations > 0 ? donations.reduce((sum, d) => sum + d.amount, 0) / totalDonations : 0

    // Calculate performance metrics
    const engagementRate = views > 0 ? (shares + totalDonations) / views : 0
    const conversionRate = views > 0 ? totalDonations / views : 0
    const shareRate = views > 0 ? shares / views : 0

    // Calculate success probability based on various factors
    const goalProgress = campaign.raised_amount / campaign.goal_amount
    const timeElapsed = (Date.now() - new Date(campaign.created_at).getTime()) / (1000 * 60 * 60 * 24) // days
    const dailyAvgDonations = timeElapsed > 0 ? totalDonations / timeElapsed : 0

    let successProbability = 0
    successProbability += Math.min(goalProgress * 40, 40) // Up to 40% based on current progress
    successProbability += Math.min(engagementRate * 100 * 20, 20) // Up to 20% based on engagement
    successProbability += Math.min(dailyAvgDonations * 10, 20) // Up to 20% based on donation velocity
    successProbability += Math.min(shares * 2, 20) // Up to 20% based on social sharing

    // Generate AI-powered recommendations
    const recommendedActions = []
    if (engagementRate < 0.05) {
      recommendedActions.push("Improve campaign description and add compelling visuals")
    }
    if (shareRate < 0.02) {
      recommendedActions.push("Encourage supporters to share on social media")
    }
    if (conversionRate < 0.01) {
      recommendedActions.push("Add clear call-to-action buttons and simplify donation process")
    }
    if (goalProgress < 0.1 && timeElapsed > 7) {
      recommendedActions.push("Consider reaching out to personal network and local media")
    }
    if (avgDonation < 500) {
      recommendedActions.push("Highlight impact of larger donations and add suggested amounts")
    }

    // Generate AI optimizations
    const aiOptimizations = {
      titleSuggestions: [
        `Help ${campaign.title} - Every Donation Counts`,
        `Support ${campaign.title} - Make a Difference Today`,
        `Join the Mission: ${campaign.title}`,
      ],
      contentImprovements: [
        "Add specific examples of how donations will be used",
        "Include testimonials or endorsements from beneficiaries",
        "Create urgency with time-sensitive goals or milestones",
        "Add progress updates and transparency reports",
      ],
      targetAudience: [
        "Local community members",
        "Social cause supporters",
        "Previous donors to similar campaigns",
        "Friends and family networks",
      ],
    }

    const insights = {
      successProbability: Math.round(successProbability),
      recommendedActions,
      performanceMetrics: {
        engagementRate,
        conversionRate,
        shareRate,
      },
      aiOptimizations,
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
