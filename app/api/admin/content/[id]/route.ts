import { type NextRequest, NextResponse } from "next/server"
import { contentDatabaseService } from "@/lib/content-database-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentId = params.id

    if (!contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Content ID is required",
        },
        { status: 400 },
      )
    }

    const item = await contentDatabaseService.getContentById(contentId)

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: "Content not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentId = params.id
    const body = await request.json()
    const { action, reason, moderatorId } = body

    if (!contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Content ID is required",
        },
        { status: 400 },
      )
    }

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Action is required",
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

    const success = await contentDatabaseService.moderateContent(contentId, moderatorId, action, reason)

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const contentId = params.id

    if (!contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Content ID is required",
        },
        { status: 400 },
      )
    }

    const success = await contentDatabaseService.deleteContentItem(contentId)

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Content deleted successfully",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete content",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Content deletion error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
