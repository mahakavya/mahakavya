"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  Download,
  Settings,
  CheckCircle,
  Clock,
} from "lucide-react"

interface AIInsight {
  id: string
  type: "sentiment" | "engagement" | "topic" | "recommendation" | "prediction"
  title: string
  description: string
  confidence: number
  impact: "high" | "medium" | "low"
  actionable: boolean
  created_at: string
  data: any
}

interface AIGroupInsightsData {
  insights: AIInsight[]
  summary: {
    total_insights: number
    high_impact_insights: number
    actionable_insights: number
    avg_confidence: number
  }
  sentiment_analysis: {
    overall_sentiment: number
    sentiment_trend: "improving" | "declining" | "stable"
    positive_ratio: number
    negative_ratio: number
    neutral_ratio: number
  }
  engagement_predictions: {
    next_week_activity: number
    peak_times: string[]
    recommended_actions: string[]
  }
  topic_analysis: {
    trending_topics: Array<{ topic: string; growth: number; sentiment: number }>
    emerging_topics: Array<{ topic: string; mentions: number; potential: number }>
  }
}

export function AIGroupInsights() {
  const [insights, setInsights] = useState<AIGroupInsightsData | null>(null)
  const [selectedInsightType, setSelectedInsightType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/chat/groups/ai-insights")
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Error fetching AI insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewInsights = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/chat/groups/ai-insights/generate", {
        method: "POST",
      })
      if (response.ok) {
        await fetchInsights()
      }
    } catch (error) {
      console.error("Error generating insights:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportInsights = async () => {
    try {
      const response = await fetch("/api/chat/groups/ai-insights/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ai-group-insights-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting insights:", error)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "sentiment":
        return <MessageSquare className="h-4 w-4" />
      case "engagement":
        return <TrendingUp className="h-4 w-4" />
      case "topic":
        return <Lightbulb className="h-4 w-4" />
      case "recommendation":
        return <Target className="h-4 w-4" />
      case "prediction":
        return <Zap className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.6) return "text-green-600"
    if (sentiment > 0.4) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredInsights =
    insights?.insights.filter((insight) => selectedInsightType === "all" || insight.type === selectedInsightType) || []

  if (isLoading || !insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Group Insights
              </CardTitle>
              <CardDescription>Advanced AI analysis of group conversations and behavior patterns</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportInsights}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={generateNewInsights} disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Generate
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{insights.summary.total_insights}</p>
              <p className="text-sm text-muted-foreground">Total Insights</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{insights.summary.high_impact_insights}</p>
              <p className="text-sm text-muted-foreground">High Impact</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{insights.summary.actionable_insights}</p>
              <p className="text-sm text-muted-foreground">Actionable</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{insights.summary.avg_confidence}%</p>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </div>
          </div>

          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant={selectedInsightType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInsightType("all")}
                >
                  All
                </Button>
                <Button
                  variant={selectedInsightType === "sentiment" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInsightType("sentiment")}
                >
                  Sentiment
                </Button>
                <Button
                  variant={selectedInsightType === "engagement" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInsightType("engagement")}
                >
                  Engagement
                </Button>
                <Button
                  variant={selectedInsightType === "recommendation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedInsightType("recommendation")}
                >
                  Recommendations
                </Button>
              </div>

              <div className="space-y-3">
                {filteredInsights.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getInsightIcon(insight.type)}
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                              {insight.impact} impact
                            </Badge>
                            {insight.actionable && (
                              <Badge variant="secondary" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                Actionable
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {insight.confidence}% confidence
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(insight.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {insight.actionable && (
                          <Button size="sm" variant="outline">
                            Take Action
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredInsights.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No insights available</h3>
                  <p className="text-muted-foreground mb-4">Generate new insights to get AI-powered recommendations</p>
                  <Button onClick={generateNewInsights} disabled={isGenerating}>
                    {isGenerating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Generate Insights
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Sentiment</CardTitle>
                    <CardDescription>Current group mood and sentiment trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Sentiment Score</span>
                        <span
                          className={`font-bold text-lg ${getSentimentColor(insights.sentiment_analysis.overall_sentiment)}`}
                        >
                          {(insights.sentiment_analysis.overall_sentiment * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={insights.sentiment_analysis.overall_sentiment * 100} className="h-2" />
                      <div className="flex items-center gap-2">
                        <TrendingUp
                          className={`h-4 w-4 ${
                            insights.sentiment_analysis.sentiment_trend === "improving"
                              ? "text-green-500"
                              : insights.sentiment_analysis.sentiment_trend === "declining"
                                ? "text-red-500"
                                : "text-yellow-500"
                          }`}
                        />
                        <span className="text-sm capitalize">{insights.sentiment_analysis.sentiment_trend}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                    <CardDescription>Breakdown of message sentiments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-green-600">Positive</span>
                        <span className="font-medium">
                          {(insights.sentiment_analysis.positive_ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={insights.sentiment_analysis.positive_ratio * 100} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-yellow-600">Neutral</span>
                        <span className="font-medium">
                          {(insights.sentiment_analysis.neutral_ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={insights.sentiment_analysis.neutral_ratio * 100} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-red-600">Negative</span>
                        <span className="font-medium">
                          {(insights.sentiment_analysis.negative_ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={insights.sentiment_analysis.negative_ratio * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Predictions</CardTitle>
                  <CardDescription>AI-powered forecasts for group activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">Next Week Activity Prediction</p>
                        <p className="text-sm text-muted-foreground">Expected message volume increase</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          +{insights.engagement_predictions.next_week_activity}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Predicted Peak Times</h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.engagement_predictions.peak_times.map((time, index) => (
                          <Badge key={index} variant="outline">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recommended Actions</h4>
                      <div className="space-y-2">
                        {insights.engagement_predictions.recommended_actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="topics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trending Topics</CardTitle>
                    <CardDescription>Topics gaining momentum in discussions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.topic_analysis.trending_topics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{topic.topic}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <TrendingUp className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">+{topic.growth}% growth</span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              topic.sentiment > 0.6 ? "default" : topic.sentiment > 0.3 ? "secondary" : "destructive"
                            }
                          >
                            {topic.sentiment > 0.6 ? "Positive" : topic.sentiment > 0.3 ? "Neutral" : "Negative"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Topics</CardTitle>
                    <CardDescription>New topics with high potential</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {insights.topic_analysis.emerging_topics.map((topic, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{topic.topic}</p>
                            <p className="text-xs text-muted-foreground">{topic.mentions} mentions</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{topic.potential}% potential</p>
                            <Progress value={topic.potential} className="w-16 h-1 mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
