import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { aiContentService } from "@/lib/ai-content-service"

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

    // AI Enhancement: Analyze content and generate insights
    let enhancementData: any = {}

    if (reel.caption) {
      try {
        const analysis = await aiContentService.analyzeContent(reel.caption)

        enhancementData = {
          sentiment_score: analysis.sentimentScore,
          toxicity_score: analysis.toxicityScore,
          category: analysis.category,
          ai_flags: analysis.flags,
          ai_recommendations: analysis.recommendations,
          risk_level: analysis.riskLevel,
        }

        // Generate hashtag suggestions based on content
        const hashtagSuggestions = this.generateHashtagSuggestions(reel.caption, analysis.category)
        enhancementData.suggested_hashtags = hashtagSuggestions
      } catch (error) {
        console.error("AI analysis failed:", error)
        enhancementData.ai_error = "Analysis failed"
      }
    }

    // Store AI enhancement data
    const { error: updateError } = await supabase
      .from("reels")
      .update({
        ai_enhancement_data: enhancementData,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", reelId)

    if (updateError) {
      console.error("Failed to update reel with AI data:", updateError)
      return NextResponse.json({ error: "Failed to save AI enhancement" }, { status: 500 })
    }

    // Create AI insights record
    await supabase.from("ai_insights").insert({
      entity_type: "reel",
      entity_id: reelId,
      user_id: user.id,
      insight_type: "content_analysis",
      insight_data: enhancementData,
      confidence_score: 0.85,
    })

    return NextResponse.json({
      success: true,
      enhancement: enhancementData,
      message: "Reel enhanced with AI analysis",
    })
  } catch (error) {
    console.error("AI enhancement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateHashtagSuggestions(caption: string, category: string): string[] {
  const suggestions = []

  // Category-based suggestions
  const categoryTags: Record<string, string[]> = {
    entertainment: ["fun", "viral", "trending", "comedy", "entertainment"],
    lifestyle: ["lifestyle", "daily", "vibe", "mood", "life"],
    music: ["music", "song", "dance", "beat", "rhythm"],
    education: ["learn", "tips", "howto", "education", "knowledge"],
    sports: ["sports", "fitness", "workout", "active", "health"],
    food: ["food", "recipe", "cooking", "delicious", "foodie"],
    travel: ["travel", "explore", "adventure", "wanderlust", "journey"],
    fashion: ["fashion", "style", "outfit", "trendy", "look"],
    art: ["art", "creative", "design", "artistic", "inspiration"],
    technology: ["tech", "innovation", "digital", "future", "gadget"],
  }

  if (categoryTags[category]) {
    suggestions.push(...categoryTags[category].slice(0, 3))
  }

  // Extract keywords from caption
  const words = caption.toLowerCase().match(/\b\w+\b/g) || []
  const commonWords = new Set([
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
    "a",
    "an",
  ])

  const keywords = words.filter((word) => word.length > 3 && !commonWords.has(word)).slice(0, 2)

  suggestions.push(...keywords)

  // Add trending tags
  suggestions.push("reels", "viral", "fyp")

  return [...new Set(suggestions)].slice(0, 8)
}
