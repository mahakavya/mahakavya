"use client"

import { useState, useEffect } from "react"
import { Zap, Play, Pause, AlertTriangle, TrendingUp, Filter } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface RPAJob {
  id: string
  type: "spam_detection" | "engagement_analysis" | "auto_moderation" | "sentiment_tracking"
  status: "running" | "paused" | "completed" | "failed"
  progress: number
  itemsProcessed: number
  totalItems: number
  startedAt: string
  estimatedCompletion?: string
}

interface RPAMetrics {
  totalAutomations: number
  spamDetected: number
  engagementOptimized: number
  moderationActions: number
  accuracyRate: number
  timesSaved: string
}

interface AutomationSettings {
  spamDetection: boolean
  autoModeration: boolean
  engagementAnalysis: boolean
  sentimentTracking: boolean
}

export function RPAMessageStatus() {
  const [jobs, setJobs] = useState<RPAJob[]>([])
  const [metrics, setMetrics] = useState<RPAMetrics>({
    totalAutomations: 0,
    spamDetected: 0,
    engagementOptimized: 0,
    moderationActions: 0,
    accuracyRate: 0,
    timesSaved: "0h",
  })
  const [settings, setSettings] = useState<AutomationSettings>({
    spamDetection: true,
    autoModeration: true,
    engagementAnalysis: true,
    sentimentTracking: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRPAStatus = async () => {
      try {
        const response = await fetch("/api/chat/rpa-status")
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs || [])
          setMetrics(data.metrics || metrics)
          setSettings(data.settings || settings)
        }
      } catch (error) {
        console.error("Error loading RPA status:", error)
        // Set mock data for demonstration
        setJobs([
          {
            id: "1",
            type: "spam_detection",
            status: "running",
            progress: 75,
            itemsProcessed: 1875,
            totalItems: 2500,
            startedAt: new Date(Date.now() - 300000).toISOString(),
            estimatedCompletion: new Date(Date.now() + 120000).toISOString(),
          },
          {
            id: "2",
            type: "engagement_analysis",
            status: "completed",
            progress: 100,
            itemsProcessed: 450,
            totalItems: 450,
            startedAt: new Date(Date.now() - 600000).toISOString(),
          },
        ])
        setMetrics({
          totalAutomations: 15420,
          spamDetected: 234,
          engagementOptimized: 1876,
          moderationActions: 89,
          accuracyRate: 96.8,
          timesSaved: "47h",
        })
      } finally {
        setLoading(false)
      }
    }

    loadRPAStatus()
    const interval = setInterval(loadRPAStatus, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const getJobIcon = (type: string) => {
    switch (type) {
      case "spam_detection":
        return <Filter className="w-4 h-4 text-red-500" />
      case "engagement_analysis":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "auto_moderation":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "sentiment_tracking":
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      default:
        return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4 text-green-500" />
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />
      case "completed":
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      case "failed":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Zap className="w-4 h-4 text-gray-500" />
    }
  }

  const formatJobType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const handleToggleAutomation = async (key: keyof AutomationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)

    try {
      await fetch("/api/chat/rpa-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })
    } catch (error) {
      console.error("Error updating RPA settings:", error)
    }
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
          <Zap className="w-5 h-5 mr-2 text-purple-600" />
          RPA Automation
        </h3>
        <Badge variant="outline">Active</Badge>
      </div>

      {/* RPA Metrics Overview */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Automation Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Actions</div>
              <div className="font-semibold text-purple-600">{metrics.totalAutomations.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-600">Spam Blocked</div>
              <div className="font-semibold text-red-600">{metrics.spamDetected}</div>
            </div>
            <div>
              <div className="text-gray-600">Optimized</div>
              <div className="font-semibold text-green-600">{metrics.engagementOptimized}</div>
            </div>
            <div>
              <div className="text-gray-600">Time Saved</div>
              <div className="font-semibold text-blue-600">{metrics.timesSaved}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Accuracy Rate</span>
              <span className="font-semibold">{metrics.accuracyRate}%</span>
            </div>
            <Progress value={metrics.accuracyRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Active Automations</h4>
        {jobs.map((job) => (
          <Card key={job.id} className="bg-white/40 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getJobIcon(job.type)}
                  <div>
                    <div className="font-medium text-sm">{formatJobType(job.type)}</div>
                    <div className="text-xs text-gray-500">
                      {job.itemsProcessed.toLocaleString()} / {job.totalItems.toLocaleString()} items
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(job.status)}
                  <Badge variant={job.status === "running" ? "default" : "secondary"} className="text-xs">
                    {job.status}
                  </Badge>
                </div>
              </div>

              {job.status === "running" && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Started: {new Date(job.startedAt).toLocaleTimeString()}</span>
                {job.estimatedCompletion && <span>ETA: {new Date(job.estimatedCompletion).toLocaleTimeString()}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automation Settings */}
      <Card className="bg-white/40 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Automation Settings</CardTitle>
          <CardDescription className="text-xs">Configure which automations to run</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Spam Detection</div>
                <div className="text-xs text-gray-500">Automatically detect and filter spam messages</div>
              </div>
              <Switch
                checked={settings.spamDetection}
                onCheckedChange={() => handleToggleAutomation("spamDetection")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto Moderation</div>
                <div className="text-xs text-gray-500">Automatically moderate inappropriate content</div>
              </div>
              <Switch
                checked={settings.autoModeration}
                onCheckedChange={() => handleToggleAutomation("autoModeration")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Engagement Analysis</div>
                <div className="text-xs text-gray-500">Analyze and optimize user engagement</div>
              </div>
              <Switch
                checked={settings.engagementAnalysis}
                onCheckedChange={() => handleToggleAutomation("engagementAnalysis")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Sentiment Tracking</div>
                <div className="text-xs text-gray-500">Track conversation sentiment in real-time</div>
              </div>
              <Switch
                checked={settings.sentimentTracking}
                onCheckedChange={() => handleToggleAutomation("sentimentTracking")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/40 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            Run Full System Scan
          </Button>
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            Generate Automation Report
          </Button>
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            Optimize All Processes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
