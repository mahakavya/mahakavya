import { type NextRequest, NextResponse } from "next/server"
import { aiContentService } from "@/lib/ai-content-service"
import { contentDatabaseService } from "@/lib/content-database-service"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Perform AI analysis
    const analysis = await aiContentService.analyzeContent(item.contentText || "", item.mediaUrls)

    // Save analysis to database
    await contentDatabaseService.saveAIAnalysis(contentId, analysis)

    // Update content item with new risk level and AI score
    await contentDatabaseService.updateContentItem(contentId, {
      riskLevel: analysis.riskLevel,
      aiScore: analysis.toxicityScore,
    })

    return NextResponse.json({
      success: true,
      data: {
        contentId,
        analysis,
        timestamp: new Date().toISOString(),
      },
      message: "Content analysis completed successfully",
    })
  } catch (error) {
    console.error("Content analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
