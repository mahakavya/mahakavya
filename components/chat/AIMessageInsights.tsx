"use client"

import { useState, useEffect } from "react"
import { Bot, TrendingUp, MessageSquare, Languages, Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface AIInsight {
  id: string
  type: "sentiment" | "language" | "engagement" | "suggestion"
  title: string
  description: string
  confidence: number
  actionable: boolean
  timestamp: string
}

interface AIMetrics {
  smartRepliesGenerated: number
  sentimentAnalysisAccuracy: number
  languagesDetected: string[]
  engagementPrediction: number
  toxicityPrevented: number
}

export function AIMessageInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [metrics, setMetrics] = useState<AIMetrics>({
    smartRepliesGenerated: 0,
    sentimentAnalysisAccuracy: 0,
    languagesDetected: [],
    engagementPrediction: 0,
    toxicityPrevented: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAIInsights = async () => {
      try {
        const response = await fetch("/api/chat/ai-insights")
        if (response.ok) {
          const data = await response.json()
          setInsights(data.insights || [])
          setMetrics(data.metrics || metrics)
        }
      } catch (error) {
        console.error("Error loading AI insights:", error)
        // Set mock data for demonstration
        setInsights([
          {
            id: "1",
            type: "sentiment",
            title: "Positive Conversation Trend",
            description:
              "Your recent conversations show 85% positive sentiment, indicating healthy communication patterns.",
            confidence: 0.85,
            actionable: false,
            timestamp: new Date().toISOString(),
          },
          {
            id: "2",
            type: "engagement",
            title: "Peak Activity Hours",
            description:
              "You're most active between 2-4 PM. Consider scheduling important conversations during this time.",
            confidence: 0.92,
            actionable: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: "3",
            type: "language",
            title: "Multilingual Conversations",
            description: "AI detected conversations in 3 languages. Translation assistance is available.",
            confidence: 0.78,
            actionable: true,
            timestamp: new Date().toISOString(),
          },
        ])
        setMetrics({
          smartRepliesGenerated: 47,
          sentimentAnalysisAccuracy: 94.2,
          languagesDetected: ["English", "Hindi", "Sanskrit"],
          engagementPrediction: 78,
          toxicityPrevented: 12,
        })
      } finally {
        setLoading(false)
      }
    }

    loadAIInsights()
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "sentiment":
        return <Heart className="w-4 h-4 text-pink-500" />
      case "language":
        return <Languages className="w-4 h-4 text-blue-500" />
      case "engagement":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "suggestion":
        return <MessageSquare className="w-4 h-4 text-purple-500" />
      default:
        return <Bot className="w-4 h-4 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Bot className="w-5 h-5 mr-2 text-blue-600" />
          AI Insights
        </h3>
        <Badge variant="outline">Live</Badge>
      </div>

      {/* AI Metrics Overview */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AI Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Smart Replies</div>
              <div className="font-semibold text-blue-600">{metrics.smartRepliesGenerated}</div>
            </div>
            <div>
              <div className="text-gray-600">Accuracy</div>
              <div className="font-semibold text-green-600">{metrics.sentimentAnalysisAccuracy}%</div>
            </div>
            <div>
              <div className="text-gray-600">Languages</div>
              <div className="font-semibold text-purple-600">{metrics.languagesDetected.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Toxicity Blocked</div>
              <div className="font-semibold text-red-600">{metrics.toxicityPrevented}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Engagement Prediction</span>
              <span className="font-semibold">{metrics.engagementPrediction}%</span>
            </div>
            <Progress value={metrics.engagementPrediction} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Individual Insights */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <Card key={insight.id} className="bg-white/40 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getInsightIcon(insight.type)}
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                </div>
                <div className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                  {Math.round(insight.confidence * 100)}%
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{new Date(insight.timestamp).toLocaleTimeString()}</span>
                {insight.actionable && (
                  <Button size="sm" variant="outline" className="text-xs bg-transparent">
                    Take Action
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Language Detection */}
      {metrics.languagesDetected.length > 0 && (
        <Card className="bg-white/40 backdrop-blur-md border-white/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Languages className="w-4 h-4 mr-2" />
              Detected Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.languagesDetected.map((language) => (
                <Badge key={language} variant="secondary" className="text-xs">
                  {language}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
