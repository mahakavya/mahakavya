"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Zap,
  Bot,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Target,
  Cog,
} from "lucide-react"

interface RPAJob {
  id: string
  name: string
  type: "moderation" | "engagement" | "analytics" | "notification" | "optimization"
  status: "running" | "paused" | "completed" | "failed"
  progress: number
  last_run: string
  next_run: string
  success_rate: number
  actions_performed: number
}

interface RPAGroupStatusData {
  automation_status: {
    is_enabled: boolean
    active_jobs: number
    completed_jobs: number
    failed_jobs: number
    total_actions: number
    efficiency_score: number
  }
  active_automations: RPAJob[]
  performance_metrics: {
    messages_processed: number
    spam_detected: number
    engagement_optimized: number
    notifications_sent: number
    response_time_improvement: number
    user_satisfaction_impact: number
  }
  automation_settings: {
    auto_moderation: boolean
    engagement_optimization: boolean
    smart_notifications: boolean
    analytics_automation: boolean
    member_onboarding: boolean
    content_enhancement: boolean
  }
  recent_activities: Array<{
    id: string
    action: string
    timestamp: string
    result: "success" | "warning" | "error"
    details: string
  }>
}

export function RPAGroupStatus() {
  const [status, setStatus] = useState<RPAGroupStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

  useEffect(() => {
    fetchRPAStatus()
    const interval = setInterval(fetchRPAStatus, 15000) // Update every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRPAStatus = async () => {
    try {
      const response = await fetch("/api/chat/groups/rpa-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching RPA status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAutomation = async (enabled: boolean) => {
    try {
      const response = await fetch("/api/chat/groups/rpa-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      if (response.ok) {
        await fetchRPAStatus()
      }
    } catch (error) {
      console.error("Error toggling automation:", error)
    }
  }

  const updateAutomationSetting = async (setting: string, enabled: boolean) => {
    setIsUpdatingSettings(true)
    try {
      const response = await fetch("/api/chat/groups/rpa-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [setting]: enabled }),
      })
      if (response.ok) {
        await fetchRPAStatus()
      }
    } catch (error) {
      console.error("Error updating automation setting:", error)
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const controlJob = async (jobId: string, action: "start" | "pause" | "restart") => {
    try {
      const response = await fetch(`/api/chat/groups/rpa-jobs/${jobId}/${action}`, {
        method: "POST",
      })
      if (response.ok) {
        await fetchRPAStatus()
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
    }
  }

  const getJobIcon = (type: string) => {
    switch (type) {
      case "moderation":
        return <AlertTriangle className="h-4 w-4" />
      case "engagement":
        return <TrendingUp className="h-4 w-4" />
      case "analytics":
        return <BarChart3 className="h-4 w-4" />
      case "notification":
        return <Bot className="h-4 w-4" />
      case "optimization":
        return <Target className="h-4 w-4" />
      default:
        return <Cog className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-600 bg-green-50"
      case "paused":
        return "text-yellow-600 bg-yellow-50"
      case "completed":
        return "text-blue-600 bg-blue-50"
      case "failed":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Activity className="h-4 w-4 text-green-600" />
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading || !status) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RPA Automation
            </CardTitle>
            <CardDescription>Intelligent process automation for group management</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.automation_status.is_enabled ? "default" : "secondary"}>
              {status.automation_status.is_enabled ? "Active" : "Inactive"}
            </Badge>
            <Switch checked={status.automation_status.is_enabled} onCheckedChange={toggleAutomation} />
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{status.automation_status.active_jobs}</p>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{status.automation_status.completed_jobs}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{status.automation_status.total_actions}</p>
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{status.automation_status.efficiency_score}%</p>
                  <p className="text-sm text-muted-foreground">Efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Processing Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Messages Processed</span>
                    <span className="font-bold">{status.performance_metrics.messages_processed.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Spam Detected</span>
                    <span className="font-bold text-red-600">{status.performance_metrics.spam_detected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Engagement Optimized</span>
                    <span className="font-bold text-green-600">{status.performance_metrics.engagement_optimized}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications Sent</span>
                    <span className="font-bold text-blue-600">{status.performance_metrics.notifications_sent}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Impact Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time Improvement</span>
                      <span className="font-bold text-green-600">
                        -{status.performance_metrics.response_time_improvement}%
                      </span>
                    </div>
                    <Progress value={status.performance_metrics.response_time_improvement} className="h-1" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User Satisfaction Impact</span>
                      <span className="font-bold text-blue-600">
                        +{status.performance_metrics.user_satisfaction_impact}%
                      </span>
                    </div>
                    <Progress value={status.performance_metrics.user_satisfaction_impact} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="space-y-3">
              {status.active_automations.map((job) => (
                <Card key={job.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getJobIcon(job.type)}
                          <span className="font-medium">{job.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {job.type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(job.status)}`}>{job.status}</Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-1" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="block">Success Rate</span>
                            <span className="font-medium text-green-600">{job.success_rate}%</span>
                          </div>
                          <div>
                            <span className="block">Actions</span>
                            <span className="font-medium">{job.actions_performed}</span>
                          </div>
                          <div>
                            <span className="block">Last Run</span>
                            <span className="font-medium">{new Date(job.last_run).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block">Next Run</span>
                            <span className="font-medium">{new Date(job.next_run).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {job.status === "running" ? (
                          <Button variant="outline" size="sm" onClick={() => controlJob(job.id, "pause")}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => controlJob(job.id, "start")}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => controlJob(job.id, "restart")}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {status.active_automations.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active automations</h3>
                <p className="text-muted-foreground">
                  Enable automation settings to start intelligent group management
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Automation Settings</CardTitle>
                <CardDescription>Configure intelligent automation features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Moderation</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically detect and handle spam, inappropriate content
                      </p>
                    </div>
                    <Switch
                      checked={status.automation_settings.auto_moderation}
                      onCheckedChange={(checked) => updateAutomationSetting("auto_moderation", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Engagement Optimization</p>
                      <p className="text-sm text-muted-foreground">
                        Optimize message timing and content for better engagement
                      </p>
                    </div>
                    <Switch
                      checked={status.automation_settings.engagement_optimization}
                      onCheckedChange={(checked) => updateAutomationSetting("engagement_optimization", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Smart Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Intelligent notification scheduling and personalization
                      </p>
                    </div>
                    <Switch
                      checked={status.automation_settings.smart_notifications}
                      onCheckedChange={(checked) => updateAutomationSetting("smart_notifications", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analytics Automation</p>
                      <p className="text-sm text-muted-foreground">Automated insights generation and reporting</p>
                    </div>
                    <Switch
                      checked={status.automation_settings.analytics_automation}
                      onCheckedChange={(checked) => updateAutomationSetting("analytics_automation", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Member Onboarding</p>
                      <p className="text-sm text-muted-foreground">Automated welcome messages and group introduction</p>
                    </div>
                    <Switch
                      checked={status.automation_settings.member_onboarding}
                      onCheckedChange={(checked) => updateAutomationSetting("member_onboarding", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Content Enhancement</p>
                      <p className="text-sm text-muted-foreground">AI-powered content suggestions and improvements</p>
                    </div>
                    <Switch
                      checked={status.automation_settings.content_enhancement}
                      onCheckedChange={(checked) => updateAutomationSetting("content_enhancement", checked)}
                      disabled={isUpdatingSettings}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-3">
              {status.recent_activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {getResultIcon(activity.result)}
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">{activity.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          activity.result === "success"
                            ? "default"
                            : activity.result === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {activity.result}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {status.recent_activities.length === 0 && (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">Automation activities will appear here as they occur</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
