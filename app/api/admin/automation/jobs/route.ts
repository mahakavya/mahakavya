import { type NextRequest, NextResponse } from "next/server"
import { contentDatabaseService } from "@/lib/content-database-service"
import { rpaContentService } from "@/lib/rpa-content-service"

export async function GET(request: NextRequest) {
  try {
    const jobs = await contentDatabaseService.getAutomationJobs()

    return NextResponse.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    console.error("Jobs fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobType, parameters } = body

    if (!jobType) {
      return NextResponse.json(
        {
          success: false,
          error: "Job type is required",
        },
        { status: 400 },
      )
    }

    // Validate job type
    const validJobTypes = ["content_scan", "duplicate_detection", "bulk_moderation"]
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid job type. Must be one of: ${validJobTypes.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Create job in database
    const jobId = await contentDatabaseService.createAutomationJob({
      jobType,
      parameters: parameters || {},
      status: "queued",
    })

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create job",
        },
        { status: 500 },
      )
    }

    // Start the job processing (this would typically be done by a background worker)
    // For now, we'll use the RPA service to simulate job processing
    switch (jobType) {
      case "content_scan":
        rpaContentService.createContentScanJob(parameters?.filters || {})
        break
      case "duplicate_detection":
        rpaContentService.createDuplicateDetectionJob(parameters?.contentType || "post")
        break
      case "bulk_moderation":
        rpaContentService.createBulkModerationJob(parameters?.contentIds || [], parameters?.criteria || {})
        break
    }

    return NextResponse.json({
      success: true,
      data: { jobId },
      message: `${jobType} job started successfully`,
    })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
