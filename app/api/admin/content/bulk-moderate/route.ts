import { type NextRequest, NextResponse } from "next/server"
import { rpaContentService } from "@/lib/rpa-content-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentIds, criteria } = body

    if (!contentIds || !Array.isArray(contentIds)) {
      return NextResponse.json({ success: false, error: "Content IDs are required" }, { status: 400 })
    }

    const jobId = await rpaContentService.createBulkModerationJob(contentIds, criteria || {})

    return NextResponse.json({
      success: true,
      data: { jobId },
      message: "Bulk moderation job started",
    })
  } catch (error) {
    console.error("Bulk moderation error:", error)
    return NextResponse.json({ success: false, error: "Failed to start bulk moderation" }, { status: 500 })
  }
}
