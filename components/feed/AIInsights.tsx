"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Brain, Target, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { monitoring } from "@/lib/monitoring"

interface AIInsightsProps {
  insights: {
    recommendationsCount: number
    engagementScore: number
    personalizedTopics: string[]
    contentSuggestions: Array<{
      type: string
      title: string
      confidence: number
    }>
    behaviorAnalysis: {
      primaryInterests: string[]
      engagementPattern: string
      bestPostingTime: string
    }
  }
}

export function AIInsights({ insights }: AIInsightsProps) {
  const { user } = useAuth()

  const handleApplyRecommendation = async (recommendation: any) => {
    try {
      const response = await fetch("/api/feed/ai-apply-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          recommendation,
        }),
      })

      if (response.ok) {
        monitoring.logUserAction(
          "ai_recommendation_applied",
          {
            type: recommendation.type,
            confidence: recommendation.confidence,
          },
          user?.id,
        )
      }
    } catch (error) {
      console.error("Failed to apply recommendation:", error)
    }
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <Card className="heritage-card border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span>AI Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engagement Score */}
        <div className="p-3 rounded-lg bg-purple-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Engagement Score</span>
            <Badge className={getEngagementColor(insights.engagementScore)}>{insights.engagementScore}%</Badge>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${insights.engagementScore}%` }}
            ></div>
          </div>
        </div>

        {/* Personalized Topics */}
        <div>
          <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-1" />
            Recommended Topics
          </h4>
          <div className="flex flex-wrap gap-1">
            {insights.personalizedTopics.map((topic, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                onClick={() => (window.location.href = `/search?q=${encodeURIComponent(topic)}`)}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content Suggestions */}
        <div>
          <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
            <Brain className="h-4 w-4 mr-1" />
            Content Suggestions
          </h4>
          <div className="space-y-2">
            {insights.contentSuggestions.slice(0, 3).map((suggestion, index) => (
              <div
                key={index}
                className="p-2 rounded bg-purple-50/50 hover:bg-purple-100/50 transition-colors cursor-pointer"
                onClick={() => handleApplyRecommendation(suggestion)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-900">{suggestion.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(suggestion.confidence * 100)}%
                  </Badge>
                </div>
                <span className="text-xs text-purple-600 capitalize">{suggestion.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Behavior Analysis */}
        <div>
          <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Your Patterns
          </h4>
          <div className="space-y-2 text-xs text-purple-700">
            <div>
              <span className="font-medium">Primary Interests:</span>{" "}
              {insights.behaviorAnalysis.primaryInterests.join(", ")}
            </div>
            <div>
              <span className="font-medium">Engagement Pattern:</span> {insights.behaviorAnalysis.engagementPattern}
            </div>
            <div>
              <span className="font-medium">Best Posting Time:</span> {insights.behaviorAnalysis.bestPostingTime}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
          onClick={() => (window.location.href = "/settings?tab=ai")}
        >
          Customize AI Settings
        </Button>
      </CardContent>
    </Card>
  )
}
