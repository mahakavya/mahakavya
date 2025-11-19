import { type NextRequest, NextResponse } from "next/server"
import { contentDatabaseService } from "@/lib/content-database-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const riskLevel = searchParams.get("riskLevel") || undefined
    const type = searchParams.get("type") || undefined
    const search = searchParams.get("search") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const filters = { status, riskLevel, type, search, limit, offset }
    const result = await contentDatabaseService.getContentItems(filters)

    return NextResponse.json({
      success: true,
      data: result.items,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: result.total > offset + limit,
      },
    })
  } catch (error) {
    console.error("Content fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, contentIds, reason, moderatorId } = body

    if (!action || !contentIds || !Array.isArray(contentIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request parameters. Action and contentIds are required.",
        },
        { status: 400 },
      )
    }

    if (!moderatorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Moderator ID is required",
        },
        { status: 400 },
      )
    }

    // Validate action
    if (!["approve", "reject", "flag"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be approve, reject, or flag.",
        },
        { status: 400 },
      )
    }

    if (contentIds.length === 1) {
      // Single content moderation
      const success = await contentDatabaseService.moderateContent(contentIds[0], moderatorId, action, reason)

      if (success) {
        return NextResponse.json({
          success: true,
          message: `Content ${action}ed successfully`,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to moderate content",
          },
          { status: 500 },
        )
      }
    } else {
      // Bulk moderation
      const result = await contentDatabaseService.bulkModerate(contentIds, moderatorId, action, reason)

      return NextResponse.json({
        success: true,
        message: `Bulk moderation completed: ${result.success} successful, ${result.failed} failed`,
        data: result,
      })
    }
  } catch (error) {
    console.error("Content moderation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to moderate content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
