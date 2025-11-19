import { generateText } from "@/lib/ai"
import { openai } from "@/lib/openai"

export interface ContentAnalysis {
  toxicityScore: number
  sentimentScore: number
  category: string
  confidence: number
  flags: string[]
  recommendations: string
  riskLevel: "low" | "medium" | "high" | "critical"
}

export interface ContentItem {
  id: string
  type: "post" | "reel" | "comment"
  contentId: string
  authorId: string
  contentText?: string
  mediaUrls?: string[]
  status: "pending" | "approved" | "rejected" | "flagged"
  riskLevel: "low" | "medium" | "high" | "critical"
  aiScore: number
  createdAt: string
  author?: {
    id: string
    name: string
    avatarUrl?: string
  }
}

class AIContentService {
  async analyzeContent(content: string, mediaUrls?: string[]): Promise<ContentAnalysis> {
    try {
      const analysisPrompt = `
        Analyze the following content for moderation purposes:
        
        Text: "${content}"
        Media URLs: ${mediaUrls?.join(", ") || "None"}
        
        Provide analysis in the following JSON format:
        {
          "toxicityScore": 0.0-1.0,
          "sentimentScore": -1.0 to 1.0,
          "category": "category_name",
          "confidence": 0.0-1.0,
          "flags": ["flag1", "flag2"],
          "recommendations": "moderation_recommendation",
          "riskLevel": "low|medium|high|critical"
        }
        
        Consider:
        - Hate speech, harassment, bullying
        - Spam, scams, misinformation
        - Adult content, violence
        - Cultural sensitivity
        - Community guidelines compliance
      `

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: "You are an AI content moderator. Analyze content and respond with JSON only.",
        prompt: analysisPrompt,
      })

      const analysis = JSON.parse(text)

      return {
        toxicityScore: analysis.toxicityScore || 0,
        sentimentScore: analysis.sentimentScore || 0,
        category: analysis.category || "general",
        confidence: analysis.confidence || 0.5,
        flags: analysis.flags || [],
        recommendations: analysis.recommendations || "No specific recommendations",
        riskLevel: analysis.riskLevel || "low",
      }
    } catch (error) {
      console.error("AI Content Analysis Error:", error)
      return {
        toxicityScore: 0,
        sentimentScore: 0,
        category: "unknown",
        confidence: 0,
        flags: ["analysis_failed"],
        recommendations: "Manual review required due to analysis failure",
        riskLevel: "medium",
      }
    }
  }

  async batchAnalyzeContent(
    items: Array<{ id: string; content: string; mediaUrls?: string[] }>,
  ): Promise<Map<string, ContentAnalysis>> {
    const results = new Map<string, ContentAnalysis>()

    // Process in batches of 5 to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchPromises = batch.map(async (item) => {
        const analysis = await this.analyzeContent(item.content, item.mediaUrls)
        return { id: item.id, analysis }
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach(({ id, analysis }) => {
        results.set(id, analysis)
      })

      // Small delay between batches
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return results
  }

  async generateModerationSummary(contentItems: ContentItem[]): Promise<string> {
    try {
      const summaryData = {
        totalItems: contentItems.length,
        riskDistribution: this.getRiskDistribution(contentItems),
        topFlags: this.getTopFlags(contentItems),
        recommendations: this.getOverallRecommendations(contentItems),
      }

      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: "You are an AI moderation assistant. Generate concise moderation summaries.",
        prompt: `Generate a moderation summary based on this data: ${JSON.stringify(summaryData)}`,
      })

      return text
    } catch (error) {
      console.error("Summary generation error:", error)
      return "Unable to generate summary at this time."
    }
  }

  private getRiskDistribution(items: ContentItem[]) {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 }
    items.forEach((item) => {
      distribution[item.riskLevel]++
    })
    return distribution
  }

  private getTopFlags(items: ContentItem[]): string[] {
    // This would analyze common flags from AI analysis
    return ["spam", "inappropriate_language", "misinformation"]
  }

  private getOverallRecommendations(items: ContentItem[]): string[] {
    const highRiskCount = items.filter((item) => item.riskLevel === "high" || item.riskLevel === "critical").length
    const recommendations = []

    if (highRiskCount > 0) {
      recommendations.push(`${highRiskCount} items require immediate attention`)
    }

    recommendations.push("Regular monitoring recommended")
    return recommendations
  }
}

export const aiContentService = new AIContentService()
