import { type NextRequest, NextResponse } from "next/server"
import { contentDatabaseService } from "@/lib/content-database-service"

export async function GET(request: NextRequest) {
  try {
    const stats = await contentDatabaseService.getContentStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
