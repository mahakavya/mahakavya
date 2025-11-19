"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Bot, Play, Pause, Settings, TrendingUp, Clock, Zap, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RPAStatus {
  isEnabled: boolean
  automationLevel: "basic" | "advanced" | "premium"
  activeJobs: number
  completedJobs: number
  successRate: number
  timeSaved: number
  nextOptimization: string
  currentTasks: Array<{
    id: string
    name: string
    status: "running" | "completed" | "failed" | "queued"
    progress: number
    estimatedTime: string
  }>
  benefits: {
    autoEntry: boolean
    smartTiming: boolean
    resultNotifications: boolean
    performanceAnalytics: boolean
  }
}

export function RPADrawAutomation() {
  const [status, setStatus] = useState<RPAStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const { toast } = useToast()

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/draws/rpa-status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch RPA status")
      }

      setStatus(data)
    } catch (error) {
      console.error("Failed to fetch RPA status:", error)
      toast({
        title: "Error",
        description: "Failed to load RPA status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleAutomation = async () => {
    if (!status) return

    setIsToggling(true)
    try {
      const response = await fetch("/api/draws/rpa-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !status.isEnabled }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle automation")
      }

      setStatus({ ...status, isEnabled: !status.isEnabled })
      toast({
        title: "Success!",
        description: `Automation ${!status.isEnabled ? "enabled" : "disabled"}`,
      })
    } catch (error) {
      console.error("Failed to toggle automation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle automation",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

  const triggerOptimization = async () => {
    try {
      const response = await fetch("/api/draws/rpa-optimize", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger optimization")
      }

      toast({
        title: "Optimization Started!",
        description: "RPA optimization job has been queued",
      })

      // Refresh status to show new job
      fetchStatus()
    } catch (error) {
      console.error("Failed to trigger optimization:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start optimization",
        variant: "destructive",
      })
    }
  }

  const getAutomationLevelColor = () => {
    if (!status) return "bg-gray-100 text-gray-800"
    switch (status.automationLevel) {
      case "premium":
        return "bg-purple-100 text-purple-800"
      case "advanced":
        return "bg-blue-100 text-blue-800"
      case "basic":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskStatusColor = (taskStatus: string) => {
    switch (taskStatus) {
      case "running":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "queued":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-green-200 rounded w-1/3"></div>
            <div className="h-8 bg-green-200 rounded w-2/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-green-200 rounded"></div>
              <div className="h-4 bg-green-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Bot className="h-5 w-5" />
          RPA Automation
          <Badge className={getAutomationLevelColor()}>{status.automationLevel.toUpperCase()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Automation Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-green-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.isEnabled ? "bg-green-100" : "bg-gray-100"}`}>
              {status.isEnabled ? (
                <Play className="h-4 w-4 text-green-600" />
              ) : (
                <Pause className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {status.isEnabled ? "Automation Active" : "Automation Paused"}
              </div>
              <div className="text-sm text-gray-500">
                {status.isEnabled ? "Smart draw optimization running" : "Manual mode enabled"}
              </div>
            </div>
          </div>
          <Switch checked={status.isEnabled} onCheckedChange={handleToggleAutomation} disabled={isToggling} />
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Success Rate</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{status.successRate}%</div>
            <div className="text-xs text-gray-500">{status.completedJobs} jobs completed</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Time Saved</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{status.timeSaved}h</div>
            <div className="text-xs text-gray-500">This month</div>
          </div>
        </div>

        {/* Active Tasks */}
        {status.currentTasks.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
            <h4 className="font-medium text-gray-900 mb-3">🤖 Active Tasks</h4>
            <div className="space-y-3">
              {status.currentTasks.map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{task.name}</span>
                    <Badge className={getTaskStatusColor(task.status)}>{task.status}</Badge>
                  </div>
                  {task.status === "running" && (
                    <>
                      <Progress value={task.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{task.progress}% complete</span>
                        <span>ETA: {task.estimatedTime}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automation Benefits */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
          <h4 className="font-medium text-gray-900 mb-3">⚡ Enabled Features</h4>
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`flex items-center gap-2 ${status.benefits.autoEntry ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${status.benefits.autoEntry ? "bg-green-500" : "bg-gray-300"}`}
              ></div>
              <span className="text-sm">Auto Entry</span>
            </div>
            <div
              className={`flex items-center gap-2 ${status.benefits.smartTiming ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${status.benefits.smartTiming ? "bg-green-500" : "bg-gray-300"}`}
              ></div>
              <span className="text-sm">Smart Timing</span>
            </div>
            <div
              className={`flex items-center gap-2 ${status.benefits.resultNotifications ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${status.benefits.resultNotifications ? "bg-green-500" : "bg-gray-300"}`}
              ></div>
              <span className="text-sm">Result Alerts</span>
            </div>
            <div
              className={`flex items-center gap-2 ${status.benefits.performanceAnalytics ? "text-green-600" : "text-gray-400"}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${status.benefits.performanceAnalytics ? "bg-green-500" : "bg-gray-300"}`}
              ></div>
              <span className="text-sm">Analytics</span>
            </div>
          </div>
        </div>

        {/* Next Optimization */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">🎯 Next Optimization</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerOptimization}
              className="border-green-200 hover:bg-green-50 bg-transparent"
            >
              <Zap className="h-4 w-4 mr-1" />
              Optimize Now
            </Button>
          </div>
          <p className="text-sm text-gray-600">{status.nextOptimization}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-green-200 hover:bg-green-50 bg-transparent"
            onClick={fetchStatus}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex-1 border-green-200 hover:bg-green-50 bg-transparent">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
