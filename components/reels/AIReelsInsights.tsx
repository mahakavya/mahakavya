"use client"

import { useState, useEffect } from "react"
import { Brain, Zap, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface AIReelsInsightsProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onOptimize: () => void
}

interface AIInsights {
  engagementScore: number
  recommendedTags: string[]
  optimalPostTime: string
  audienceInsights: {
    primaryAge: string
    topInterests: string[]
    engagementPattern: string
  }
  contentSuggestions: string[]
}

export function AIReelsInsights({ enabled, onToggle, onOptimize }: AIReelsInsightsProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (enabled) {
      fetchInsights()
    }
  }, [enabled])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/reels/ai-insights")
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error)
      toast({
        title: "AI Insights Error",
        description: "Unable to load AI insights at this time.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = async () => {
    setLoading(true)
    try {
      await onOptimize()
      await fetchInsights() // Refresh insights after optimization
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!enabled)}
        className="flex items-center gap-1"
      >
        <Brain className="h-4 w-4" />
        <span className="hidden sm:inline">AI</span>
      </Button>

      {enabled && insights && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {insights.engagementScore}%
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOptimize}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <Zap className="h-4 w-4" />
            {loading ? "..." : "Optimize"}
          </Button>
        </div>
      )}

      {enabled && !insights && loading && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Loading AI...</span>
        </div>
      )}
    </div>
  )
}
