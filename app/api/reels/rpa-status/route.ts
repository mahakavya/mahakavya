import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { rpaContentService } from "@/lib/rpa-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get RPA job statistics
    const jobs = await rpaContentService.getAllJobs()
    const userJobs = jobs.filter((job) => job.parameters?.userId === user.id || job.jobType === "engagement_analysis")

    const activeJobs = userJobs.filter((job) => job.status === "running" || job.status === "queued").length
    const completedJobs = userJobs.filter((job) => job.status === "completed").length

    // Calculate automation score based on recent activity
    const recentJobs = userJobs.filter((job) => {
      const jobDate = new Date(job.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return jobDate > weekAgo
    })

    const automationScore = Math.min(100, recentJobs.length * 10 + completedJobs * 2)

    // Get user's recent engagement metrics
    const { data: reels, error: reelsError } = await supabase
      .from("reels")
      .select("views, likes, created_at")
      .eq("author_id", user.id)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    if (reelsError) {
      console.error("Failed to fetch user reels:", reelsError)
    }

    // Calculate engagement boost from RPA optimization
    const totalViews = reels?.reduce((sum, reel) => sum + reel.views, 0) || 0
    const totalLikes = reels?.reduce((sum, reel) => sum + reel.likes, 0) || 0
    const engagementRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0
    const engagementBoost = Math.max(0, engagementRate - 3) // Assume 3% baseline

    // Get moderation actions count
    const moderationJobs = userJobs.filter((job) => job.jobType === "bulk_moderation" || job.jobType === "content_scan")
    const moderationActions = moderationJobs.reduce((sum, job) => {
      return sum + (job.results?.processed || 0)
    }, 0)

    const lastOptimization =
      recentJobs.length > 0
        ? recentJobs[recentJobs.length - 1].createdAt
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const status = {
      activeJobs,
      completedJobs,
      automationScore,
      lastOptimization,
      engagementBoost: Math.round(engagementBoost * 10) / 10,
      moderationActions,
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("RPA status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
