"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function AIInsightsPanel() {
  const [insights, setInsights] = useState({
    listenerRecommendations: [],
    sessionTopicSuggestions: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true)
      try {
        // Simulate fetching AI insights
        const response = await fetch("/api/sahaya/ai-insights")
        const data = await response.json()
        setInsights(data)
      } catch (error) {
        console.error("Failed to load AI insights:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [])

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <p>Loading AI insights...</p>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Listener Recommendations</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {insights.listenerRecommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Session Topic Suggestions</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {insights.sessionTopicSuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
