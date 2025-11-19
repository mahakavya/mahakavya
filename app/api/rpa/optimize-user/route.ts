import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"
import { rpaContentService } from "@/lib/rpa-content-service"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/rpa/optimize-user", "POST", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    // Get user's recent activity for optimization analysis
    const { data: userActivity } = await supabase
      .from("user_activity_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100)

    // Get user's posts for content analysis
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id, content, tags, likes_count, comments_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    // Create optimization jobs
    const optimizationJobs = []

    // 1. Content optimization job
    if (userPosts && userPosts.length > 0) {
      const contentOptimizationJob = await rpaContentService.createEngagementAnalysisJob({
        sessionId: `optimization_${Date.now()}`,
        userId,
        action: "content_optimization",
        page: "samvaaha",
        timestamp: new Date().toISOString(),
      })
      optimizationJobs.push(contentOptimizationJob)
    }

    // 2. Engagement pattern analysis
    if (userActivity && userActivity.length > 0) {
      const engagementAnalysisJob = await rpaContentService.createEngagementAnalysisJob({
        sessionId: `engagement_${Date.now()}`,
        userId,
        action: "engagement_analysis",
        page: "samvaaha",
        timestamp: new Date().toISOString(),
      })
      optimizationJobs.push(engagementAnalysisJob)
    }

    // Store optimization jobs in database
    const jobInserts = optimizationJobs.map((jobId) => ({
      user_id: userId,
      job_type: "user_optimization",
      status: "queued",
      parameters: {
        optimizationType: "comprehensive",
        jobIds: optimizationJobs,
        triggeredBy: "manual_request",
      },
      progress: 0,
      external_job_id: jobId,
    }))

    if (jobInserts.length > 0) {
      await supabase.from("rpa_jobs").insert(jobInserts)
    }

    // Update user's last optimization timestamp
    await supabase.from("user_preferences").upsert({
      user_id: userId,
      last_rpa_optimization: new Date().toISOString(),
      optimization_jobs_count: optimizationJobs.length,
    })

    // Log optimization request
    await supabase.from("user_activity_logs").insert({
      user_id: userId,
      action: "rpa_optimization_requested",
      details: {
        jobsCreated: optimizationJobs.length,
        optimizationType: "comprehensive",
        requestedAt: new Date().toISOString(),
      },
    })

    const response = {
      success: true,
      message: "User optimization started successfully",
      jobsCreated: optimizationJobs.length,
      jobIds: optimizationJobs,
      estimatedCompletionTime: "5-10 minutes",
      optimizationAreas: [
        "Content engagement analysis",
        "Posting time optimization",
        "Hashtag recommendations",
        "Audience targeting",
      ],
    }

    monitoring.logApiCall("/api/rpa/optimize-user", "POST", Date.now() - startTime, 200, session.user.id)
    monitoring.logUserAction(
      "rpa_user_optimization_started",
      {
        jobsCreated: optimizationJobs.length,
        userId,
      },
      session.user.id,
    )

    return NextResponse.json(response)
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/rpa/optimize-user" })
    monitoring.logApiCall("/api/rpa/optimize-user", "POST", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
