import { type NextRequest, NextResponse } from "next/server"
// Uses request.url to parse query params — force dynamic
export const dynamic = 'force-dynamic'
import { recommendationEngine } from "@/lib/recommendation-engine"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentType = (searchParams.get("type") as "posts" | "reels" | "campaigns" | "all") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const recommendations = await recommendationEngine.generateRecommendations(profile.user_id, contentType, limit)

    return NextResponse.json({
      recommendations,
      count: recommendations.length,
    })
  } catch (error) {
    console.error("Recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { contentId, interactionType } = await request.json()

    await recommendationEngine.recordInteraction(profile.user_id, contentId, interactionType)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Interaction recording error:", error)
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 })
  }
}
