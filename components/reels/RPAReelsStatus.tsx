"use client"

import { useState, useEffect } from "react"
import { Bot, Play, Settings, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface RPAReelsStatusProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onOptimize: () => void
}

interface RPAStatus {
  activeJobs: number
  completedJobs: number
  automationScore: number
  lastOptimization: string
  engagementBoost: number
  moderationActions: number
}

export function RPAReelsStatus({ enabled, onToggle, onOptimize }: RPAReelsStatusProps) {
  const [status, setStatus] = useState<RPAStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (enabled) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 15000) // Update every 15 seconds
      return () => clearInterval(interval)
    }
  }, [enabled])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/reels/rpa-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch RPA status:", error)
    }
  }

  const handleOptimize = async () => {
    setLoading(true)
    try {
      await onOptimize()
      await fetchStatus() // Refresh status after optimization
      toast({
        title: "RPA Optimization Started",
        description: "Automated processes are optimizing your reel engagement.",
      })
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Unable to start RPA optimization.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getAutomationLevel = () => {
    if (!status) return "inactive"
    if (status.automationScore >= 80) return "high"
    if (status.automationScore >= 50) return "medium"
    return "low"
  }

  const getAutomationColor = () => {
    const level = getAutomationLevel()
    switch (level) {
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
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
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">RPA</span>
      </Button>

      {enabled && status && (
        <div className="flex items-center gap-2">
          <Badge variant={getAutomationColor()} className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">{status.automationScore}%</span>
          </Badge>

          {status.activeJobs > 0 && (
            <Badge variant="default" className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {status.activeJobs}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOptimize}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            {loading ? "..." : "Optimize"}
          </Button>
        </div>
      )}

      {enabled && !status && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Starting RPA...</span>
        </div>
      )}
    </div>
  )
}
