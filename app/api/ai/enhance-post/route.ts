import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"
import { aiService } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Content too short to enhance" }, { status: 400 })
    }

    // Use AI service to enhance the content
    const enhancementPrompt = `
      Enhance this social media post for a cultural and spiritual community platform called Mahakavya. 
      Make it more engaging, culturally sensitive, and meaningful while preserving the original intent.
      Keep it authentic and not overly promotional.
      
      Original post: "${content}"
      
      Please provide:
      1. Enhanced version of the content
      2. 2-3 specific suggestions for improvement
    `

    const aiResponse = await aiService.sendMessage(enhancementPrompt, {
      page: "samvaaha",
      currentAction: "enhance_post",
      userRole: "community_member",
    })

    // Parse the AI response to extract enhanced content and suggestions
    const enhancedContent = extractEnhancedContent(aiResponse.content, content)
    const suggestions = extractSuggestions(aiResponse.content)

    // Log the enhancement for analytics
    await supabase.from("ai_enhancements").insert({
      user_id: profile.id,
      original_content: content,
      enhanced_content: enhancedContent,
      suggestions: suggestions,
      enhancement_score: calculateEnhancementScore(content, enhancedContent),
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      enhancedContent,
      suggestions,
      improvementScore: calculateEnhancementScore(content, enhancedContent),
    })
  } catch (error) {
    console.error("AI enhancement error:", error)

    // Provide fallback enhancement
    const { content } = await request.json()
    const fallbackEnhanced = provideFallbackEnhancement(content)

    return NextResponse.json({
      enhancedContent: fallbackEnhanced,
      suggestions: [
        "Consider adding relevant hashtags to increase visibility",
        "Share personal experiences to make the content more relatable",
        "Ask questions to encourage community engagement",
      ],
      improvementScore: 0.7,
    })
  }
}

function extractEnhancedContent(aiResponse: string, originalContent: string): string {
  // Try to extract enhanced content from AI response
  const enhancedMatch = aiResponse.match(/Enhanced version[:\s]*["']?([^"'\n]+)["']?/i)
  if (enhancedMatch) {
    return enhancedMatch[1].trim()
  }

  // If no clear enhanced version found, look for the main content
  const lines = aiResponse.split("\n").filter((line) => line.trim().length > 0)
  const contentLine = lines.find(
    (line) => line.length > originalContent.length * 0.8 && line.length < originalContent.length * 2,
  )

  return contentLine || originalContent
}

function extractSuggestions(aiResponse: string): string[] {
  const suggestions: string[] = []

  // Look for numbered suggestions
  const numberedMatches = aiResponse.match(/\d+\.\s*([^\n]+)/g)
  if (numberedMatches) {
    suggestions.push(...numberedMatches.map((match) => match.replace(/^\d+\.\s*/, "")))
  }

  // Look for bullet point suggestions
  const bulletMatches = aiResponse.match(/[-•]\s*([^\n]+)/g)
  if (bulletMatches) {
    suggestions.push(...bulletMatches.map((match) => match.replace(/^[-•]\s*/, "")))
  }

  // If no structured suggestions found, provide defaults
  if (suggestions.length === 0) {
    suggestions.push(
      "Consider adding more descriptive language",
      "Include relevant hashtags for better discoverability",
      "Ask a question to encourage engagement",
    )
  }

  return suggestions.slice(0, 3) // Limit to 3 suggestions
}

function calculateEnhancementScore(original: string, enhanced: string): number {
  let score = 0.5 // Base score

  // Length improvement
  if (enhanced.length > original.length * 1.1) score += 0.1

  // Word variety (simple check)
  const originalWords = new Set(original.toLowerCase().split(/\s+/))
  const enhancedWords = new Set(enhanced.toLowerCase().split(/\s+/))
  const newWords = enhancedWords.size - originalWords.size
  if (newWords > 0) score += Math.min(newWords * 0.02, 0.2)

  // Hashtag addition
  const originalHashtags = (original.match(/#\w+/g) || []).length
  const enhancedHashtags = (enhanced.match(/#\w+/g) || []).length
  if (enhancedHashtags > originalHashtags) score += 0.1

  // Question addition (engagement)
  const originalQuestions = (original.match(/\?/g) || []).length
  const enhancedQuestions = (enhanced.match(/\?/g) || []).length
  if (enhancedQuestions > originalQuestions) score += 0.1

  return Math.min(score, 1.0)
}

function provideFallbackEnhancement(content: string): string {
  let enhanced = content

  // Add emojis if none present
  if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content)) {
    enhanced = enhanced + " 🙏"
  }

  // Add a question if none present
  if (!content.includes("?")) {
    enhanced = enhanced + " What are your thoughts on this?"
  }

  // Suggest hashtags based on content
  const suggestedHashtags = []
  if (content.toLowerCase().includes("meditat")) suggestedHashtags.push("#meditation")
  if (content.toLowerCase().includes("spiritual")) suggestedHashtags.push("#spirituality")
  if (content.toLowerCase().includes("community")) suggestedHashtags.push("#community")
  if (content.toLowerCase().includes("wisdom")) suggestedHashtags.push("#wisdom")

  if (suggestedHashtags.length > 0) {
    enhanced = enhanced + " " + suggestedHashtags.slice(0, 2).join(" ")
  }

  return enhanced
}
