import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { rpaContentService } from "@/lib/rpa-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    const { reelId } = await request.json()

    if (!reelId) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 })
    }

    // Get the reel
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("*")
      .eq("id", reelId)
      .eq("author_id", user.id)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Create RPA processing jobs
    const jobs = []

    // 1. Content moderation job
    if (reel.caption) {
      const moderationJobId = await rpaContentService.createBulkModerationJob([reelId], {
        autoApprove: true,
        riskThreshold: 0.7,
        categories: ["spam", "inappropriate", "misinformation"],
      })
      jobs.push({ type: "moderation", jobId: moderationJobId })
    }

    // 2. Engagement optimization job
    const engagementJobId = await rpaContentService.createEngagementAnalysisJob({
      sessionId: crypto.randomUUID(),
      userId: user.id,
      action: "reel_upload",
      page: "/drishya",
      timestamp: new Date().toISOString(),
    })
    jobs.push({ type: "engagement", jobId: engagementJobId })

    // 3. Duplicate detection job
    const duplicateJobId = await rpaContentService.createDuplicateDetectionJob("reel")
    jobs.push({ type: "duplicate_detection", jobId: duplicateJobId })

    // Store RPA processing record
    const { error: rpaError } = await supabase.from("rpa_jobs").insert({
      entity_type: "reel",
      entity_id: reelId,
      user_id: user.id,
      job_type: "reel_processing",
      job_data: {
        jobs: jobs,
        processing_started: new Date().toISOString(),
        reel_metadata: {
          caption_length: reel.caption?.length || 0,
          has_video: !!reel.video_url,
          has_thumbnail: !!reel.thumb_url,
        },
      },
      status: "running",
    })

    if (rpaError) {
      console.error("Failed to store RPA job:", rpaError)
    }

    // Update reel with RPA processing status
    const { error: updateError } = await supabase
      .from("reels")
      .update({
        rpa_processed: true,
        rpa_processed_at: new Date().toISOString(),
        rpa_job_ids: jobs.map((j) => j.jobId),
      })
      .eq("id", reelId)

    if (updateError) {
      console.error("Failed to update reel RPA status:", updateError)
    }

    return NextResponse.json({
      success: true,
      jobs: jobs,
      message: "RPA processing initiated for reel",
    })
  } catch (error) {
    console.error("RPA processing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
