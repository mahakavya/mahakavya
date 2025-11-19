"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bot, TrendingUp, Target, Users, Lightbulb } from "lucide-react"

interface CampaignInsights {
  successProbability: number
  recommendedActions: string[]
  performanceMetrics: {
    engagementRate: number
    conversionRate: number
    shareRate: number
  }
  aiOptimizations: {
    titleSuggestions: string[]
    contentImprovements: string[]
    targetAudience: string[]
  }
}

interface AIInsightsPanelProps {
  insights: CampaignInsights
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const getSuccessColor = (probability: number) => {
    if (probability >= 80) return "text-green-600"
    if (probability >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSuccessLabel = (probability: number) => {
    if (probability >= 80) return "High"
    if (probability >= 60) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-6">
      {/* Success Probability */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI Success Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Success Probability</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${getSuccessColor(insights.successProbability)}`}>
                  {insights.successProbability}%
                </span>
                <Badge variant={insights.successProbability >= 60 ? "default" : "secondary"}>
                  {getSuccessLabel(insights.successProbability)}
                </Badge>
              </div>
            </div>
            <Progress value={insights.successProbability} className="h-2" />
            <p className="text-xs text-gray-500">Based on campaign content, timing, and historical data analysis</p>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(insights.performanceMetrics.engagementRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(insights.performanceMetrics.conversionRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(insights.performanceMetrics.shareRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Share Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">{action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Optimizations */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.aiOptimizations.titleSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Title Improvements</h4>
                <div className="space-y-2">
                  {insights.aiOptimizations.titleSuggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      "{suggestion}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.aiOptimizations.contentImprovements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Content Enhancements</h4>
                <div className="space-y-2">
                  {insights.aiOptimizations.contentImprovements.map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{improvement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {insights.aiOptimizations.targetAudience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Target Audience</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.aiOptimizations.targetAudience.map((audience, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
