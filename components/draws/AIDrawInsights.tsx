"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, Users, Target, Sparkles, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIInsights {
  winProbability: number
  optimalEntryTime: string
  popularDraws: string[]
  userEngagement: number
  recommendations: string[]
  marketTrends: {
    totalParticipants: number
    averageTicketPrice: number
    successRate: number
    peakHours: string[]
  }
}

export function AIDrawInsights() {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchInsights = async () => {
    try {
      const response = await fetch("/api/draws/ai-insights")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch AI insights")
      }

      setInsights(data)
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
      toast({
        title: "Error",
        description: "Failed to load AI insights",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchInsights()
    toast({
      title: "Refreshed!",
      description: "AI insights have been updated",
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-200 rounded w-1/3"></div>
            <div className="h-8 bg-purple-200 rounded w-2/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-purple-200 rounded"></div>
              <div className="h-16 bg-purple-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) return null

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Brain className="h-5 w-5" />
            AI Draw Insights
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Premium
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-purple-200 hover:bg-purple-50 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Win Probability */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Win Probability</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{insights.winProbability}%</div>
            <div className="text-xs text-gray-500">Based on your history</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Players</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {insights.marketTrends.totalParticipants.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Active participants</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{insights.marketTrends.successRate}%</div>
            <div className="text-xs text-gray-500">Platform average</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{insights.userEngagement}%</div>
            <div className="text-xs text-gray-500">Your activity level</div>
          </div>
        </div>

        {/* Optimal Entry Time */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <h4 className="font-medium text-gray-900 mb-2">🎯 Optimal Entry Strategy</h4>
          <p className="text-sm text-gray-600 mb-2">
            Best time to enter: <span className="font-medium text-purple-600">{insights.optimalEntryTime}</span>
          </p>
          <div className="text-xs text-gray-500">Peak hours: {insights.marketTrends.peakHours.join(", ")}</div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <h4 className="font-medium text-gray-900 mb-3">🤖 AI Recommendations</h4>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-600">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Draws */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
          <h4 className="font-medium text-gray-900 mb-3">🔥 Trending Draws</h4>
          <div className="flex flex-wrap gap-2">
            {insights.popularDraws.map((draw, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                {draw}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
