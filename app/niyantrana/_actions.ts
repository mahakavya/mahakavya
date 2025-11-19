"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { logAdminAction } from "@/lib/audit"

export async function summarizeInsights(): Promise<string> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Verify admin access
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      throw new Error("Unauthorized")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || !["ADMIN", "SUPER_ADMIN", "MASTER_ADMIN"].includes(profile.role)) {
      throw new Error("Forbidden")
    }

    // Get last 7 days of data
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const dateStr = sevenDaysAgo.toISOString().split("T")[0]

    // Fetch data for analysis
    const [usageData, flagsData, fundraisersData] = await Promise.all([
      supabase.from("daily_usage").select("*").gte("usage_date", dateStr).order("usage_date", { ascending: true }),

      supabase.from("moderation_flags").select("*").gte("created_at", sevenDaysAgo.toISOString()),

      supabase.from("fundraisers").select("*").gte("created_at", sevenDaysAgo.toISOString()),
    ])

    // Calculate insights
    const totalDAU = usageData.data?.reduce((sum, day) => sum + day.dau, 0) || 0
    const avgDAU = Math.round(totalDAU / 7)
    const totalFlags = flagsData.data?.length || 0
    const newFundraisers = fundraisersData.data?.length || 0
    const totalPosts = usageData.data?.reduce((sum, day) => sum + day.posts, 0) || 0
    const totalReels = usageData.data?.reduce((sum, day) => sum + day.reels, 0) || 0

    // Generate summary (in production, this would call an AI service)
    const insights = [
      `📊 Platform averaged ${avgDAU.toLocaleString()} daily active users over the past week`,
      `📝 Users created ${totalPosts.toLocaleString()} posts and ${totalReels.toLocaleString()} reels`,
      `🚨 ${totalFlags} content moderation flags were raised`,
      `💰 ${newFundraisers} new fundraising campaigns were launched`,
      `📈 ${
        usageData.data && usageData.data.length > 1
          ? usageData.data[usageData.data.length - 1].dau > usageData.data[0].dau
            ? "User engagement is trending upward"
            : "User engagement needs attention"
          : "Monitoring user engagement trends"
      }`,
    ]

    const summary = insights.join("\n\n")

    // Log the action
    await logAdminAction(session.user.id, "ai_insights_generated", "weekly_summary", {
      period: "7_days",
      insights_count: insights.length,
    })

    return summary
  } catch (error) {
    console.error("Failed to generate insights:", error)
    throw new Error("Failed to generate insights")
  }
}
