import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user activity data for AI analysis
    const { data: activities, error: activitiesError } = await supabase
      .from("analytics_events")
      .select("event_type, event_data, timestamp")
      .eq("user_id", profile.id)
      .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order("timestamp", { ascending: false })
      .limit(1000)

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError)
      return NextResponse.json({ error: "Failed to fetch activity data" }, { status: 500 })
    }

    // Analyze usage patterns
    const usagePatterns = analyzeUsagePatterns(activities || [])

    // Generate AI recommendations
    const recommendations = await generateRecommendations(profile, activities || [])

    // Calculate security score
    const securityScore = calculateSecurityScore(profile, activities || [])

    // Generate optimization suggestions
    const optimizationSuggestions = generateOptimizationSuggestions(usagePatterns, securityScore)

    const insights = {
      usagePatterns,
      recommendations,
      securityScore,
      optimizationSuggestions,
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeUsagePatterns(activities: any[]) {
  const hourCounts: { [key: number]: number } = {}
  const contentTypes: { [key: string]: number } = {}
  let totalEngagements = 0

  activities.forEach((activity) => {
    const hour = new Date(activity.timestamp).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1

    if (activity.event_type === "post_view" || activity.event_type === "post_like") {
      totalEngagements++
    }

    if (activity.event_data?.content_type) {
      const type = activity.event_data.content_type
      contentTypes[type] = (contentTypes[type] || 0) + 1
    }
  })

  // Find most active hour
  const mostActiveHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "12"

  const mostActiveTime = `${mostActiveHour}:00 - ${Number.parseInt(mostActiveHour) + 1}:00`

  // Get preferred content types
  const preferredContent = Object.entries(contentTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type)

  // Calculate engagement score
  const engagementScore = Math.min(100, Math.round((totalEngagements / Math.max(activities.length, 1)) * 100))

  return {
    mostActiveTime,
    preferredContent,
    engagementScore,
  }
}

async function generateRecommendations(profile: any, activities: any[]) {
  // Analyze activity patterns for theme recommendation
  const nightActivities = activities.filter((a) => {
    const hour = new Date(a.timestamp).getHours()
    return hour >= 20 || hour <= 6
  }).length

  const dayActivities = activities.length - nightActivities
  const themeRecommendation = nightActivities > dayActivities ? "dark" : "light"

  // Generate notification recommendations
  const notificationRecs = []
  const socialActivities = activities.filter((a) =>
    ["post_like", "comment_create", "follow"].includes(a.event_type),
  ).length

  if (socialActivities > 50) {
    notificationRecs.push("Consider enabling smart notification timing to reduce interruptions")
  }

  const securityEvents = activities.filter((a) => a.event_type === "login").length
  if (securityEvents > 10) {
    notificationRecs.push("Enable login alerts for enhanced security")
  }

  // Privacy recommendations
  const privacyRecs = []
  const publicPosts = activities.filter(
    (a) => a.event_type === "post_create" && a.event_data?.visibility === "public",
  ).length

  if (publicPosts > 20) {
    privacyRecs.push("Consider reviewing your profile visibility settings")
  }

  return {
    theme: themeRecommendation,
    notifications: notificationRecs,
    privacy: privacyRecs,
  }
}

function calculateSecurityScore(profile: any, activities: any[]) {
  let score = 50 // Base score

  // Check for 2FA
  if (profile.two_factor_enabled) {
    score += 25
  }

  // Check login patterns
  const loginEvents = activities.filter((a) => a.event_type === "login")
  const uniqueIPs = new Set(loginEvents.map((e) => e.event_data?.ip_address)).size

  if (uniqueIPs <= 3) {
    score += 15 // Consistent login locations
  }

  // Check for suspicious activities
  const suspiciousEvents = activities.filter(
    (a) => a.event_type === "failed_login" || a.event_type === "security_alert",
  )

  if (suspiciousEvents.length === 0) {
    score += 10
  } else {
    score -= suspiciousEvents.length * 5
  }

  return Math.max(0, Math.min(100, score))
}

function generateOptimizationSuggestions(usagePatterns: any, securityScore: number) {
  const suggestions = []

  if (securityScore < 70) {
    suggestions.push("Enable two-factor authentication to improve account security")
  }

  if (usagePatterns.engagementScore < 50) {
    suggestions.push("Enable AI-powered content personalization to see more relevant posts")
  }

  if (usagePatterns.preferredContent.length < 2) {
    suggestions.push("Interact with more diverse content types to improve recommendations")
  }

  suggestions.push("Consider enabling auto-optimization for better performance")

  return suggestions
}
