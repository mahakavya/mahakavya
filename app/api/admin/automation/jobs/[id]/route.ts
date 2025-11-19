import { type NextRequest, NextResponse } from "next/server"
import { rpaContentService } from "@/lib/rpa-content-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "Job ID is required",
        },
        { status: 400 },
      )
    }

    const job = await rpaContentService.getJobStatus(jobId)

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: job,
    })
  } catch (error) {
    console.error("Job status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
