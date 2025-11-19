"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, Play, Pause, Settings, Activity } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { monitoring } from "@/lib/monitoring"

interface RPAStatusProps {
  status: {
    activeJobs: number
    completedToday: number
    automationScore: number
    lastOptimization: string
    activeAutomations: Array<{
      id: string
      name: string
      status: "running" | "paused" | "completed"
      progress: number
      type: string
    }>
    recommendations: Array<{
      id: string
      title: string
      impact: "high" | "medium" | "low"
      category: string
    }>
  }
}

export function RPAStatus({ status }: RPAStatusProps) {
  const { user } = useAuth()

  const handleToggleAutomation = async (automationId: string, action: "pause" | "resume") => {
    try {
      const response = await fetch("/api/rpa/toggle-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          automationId,
          action,
        }),
      })

      if (response.ok) {
        monitoring.logUserAction(
          "rpa_automation_toggled",
          {
            automationId,
            action,
          },
          user?.id,
        )
      }
    } catch (error) {
      console.error("Failed to toggle automation:", error)
    }
  }

  const handleOptimizeNow = async () => {
    try {
      const response = await fetch("/api/rpa/optimize-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (response.ok) {
        monitoring.logUserAction(
          "rpa_optimization_requested",
          {
            activeJobs: status.activeJobs,
            automationScore: status.automationScore,
          },
          user?.id,
        )
      }
    } catch (error) {
      console.error("Failed to optimize:", error)
    }
  }

  const getStatusColor = (automationStatus: string) => {
    switch (automationStatus) {
      case "running":
        return "text-green-600 bg-green-100"
      case "paused":
        return "text-yellow-600 bg-yellow-100"
      case "completed":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <Card className="heritage-card border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>RPA Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Automation Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50/50 text-center">
            <div className="text-lg font-bold text-blue-900">{status.activeJobs}</div>
            <div className="text-xs text-blue-600">Active Jobs</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50/50 text-center">
            <div className="text-lg font-bold text-green-900">{status.completedToday}</div>
            <div className="text-xs text-green-600">Completed Today</div>
          </div>
        </div>

        {/* Automation Score */}
        <div className="p-3 rounded-lg bg-blue-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Automation Score</span>
            <Badge className="text-blue-600 bg-blue-100">{status.automationScore}%</Badge>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.automationScore}%` }}
            ></div>
          </div>
        </div>

        {/* Active Automations */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <Activity className="h-4 w-4 mr-1" />
            Active Automations
          </h4>
          <div className="space-y-2">
            {status.activeAutomations.slice(0, 3).map((automation) => (
              <div key={automation.id} className="flex items-center justify-between p-2 rounded bg-blue-50/50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-900">{automation.name}</span>
                    <Badge className={getStatusColor(automation.status)} variant="secondary">
                      {automation.status}
                    </Badge>
                  </div>
                  {automation.status === "running" && (
                    <div className="w-full bg-blue-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${automation.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleToggleAutomation(automation.id, automation.status === "running" ? "pause" : "resume")
                  }
                >
                  {automation.status === "running" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
          <div className="space-y-2">
            {status.recommendations.slice(0, 2).map((recommendation) => (
              <div
                key={recommendation.id}
                className="p-2 rounded bg-blue-50/50 hover:bg-blue-100/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-900">{recommendation.title}</span>
                  <Badge className={getImpactColor(recommendation.impact)} variant="secondary">
                    {recommendation.impact}
                  </Badge>
                </div>
                <span className="text-xs text-blue-600 capitalize">{recommendation.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Optimization */}
        <div className="text-xs text-blue-600">
          Last optimization: {new Date(status.lastOptimization).toLocaleString()}
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 bg-transparent"
            onClick={handleOptimizeNow}
          >
            Optimize Now
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/settings?tab=automation")}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
