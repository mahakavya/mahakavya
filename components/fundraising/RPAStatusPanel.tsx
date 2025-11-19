"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Bot, Play, Pause, TrendingUp } from "lucide-react"

interface RPAJob {
  id: string
  jobType: string
  jobStatus: "queued" | "running" | "completed" | "failed"
  progress?: number
  result?: any
  startedAt?: string
  completedAt?: string
  createdAt: string
}

interface RPAStatusPanelProps {
  campaignId: string
  optimized: boolean
}

export function RPAStatusPanel({ campaignId, optimized }: RPAStatusPanelProps) {
  const [jobs, setJobs] = useState<RPAJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [automationEnabled, setAutomationEnabled] = useState(optimized)
  const { toast } = useToast()

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/rpa-jobs`)
        if (response.ok) {
          const data = await response.json()
          setJobs(data.jobs || [])
        }
      } catch (error) {
        console.error("Failed to fetch RPA jobs:", error)
      }
    }

    fetchJobs()
  }, [campaignId])

  const handleToggleAutomation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/fundraising/campaigns/${campaignId}/rpa-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !automationEnabled }),
      })

      if (response.ok) {
        setAutomationEnabled(!automationEnabled)
        toast({
          title: automationEnabled ? "Automation disabled" : "Automation enabled",
          description: automationEnabled
            ? "RPA automation has been disabled for this campaign."
            : "RPA automation has been enabled for this campaign.",
        })
      } else {
        throw new Error("Failed to toggle automation")
      }
    } catch (error) {
      toast({
        title: "Toggle failed",
        description: "Unable to change automation settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimize = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/fundraising/campaigns/${campaignId}/rpa-optimize`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setJobs((prev) => [data.job, ...prev])
        toast({
          title: "Optimization started",
          description: "RPA optimization job has been queued for this campaign.",
        })
      } else {
        throw new Error("Optimization failed")
      }
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Unable to start RPA optimization. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      case "queued":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case "content_optimization":
        return "Content Optimization"
      case "social_sharing":
        return "Social Media Sharing"
      case "donor_outreach":
        return "Donor Outreach"
      case "performance_analysis":
        return "Performance Analysis"
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  const runningJobs = jobs.filter((job) => job.jobStatus === "running")
  const completedJobs = jobs.filter((job) => job.jobStatus === "completed")

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-500" />
          RPA Automation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Automation Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Automation Status</span>
            <Badge className={automationEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {automationEnabled ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleToggleAutomation}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
            >
              {automationEnabled ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Disable
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
            <Button onClick={handleOptimize} disabled={isLoading || !automationEnabled} size="sm" className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize
            </Button>
          </div>

          {/* Running Jobs */}
          {runningJobs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Active Jobs</h4>
              {runningJobs.map((job) => (
                <div key={job.id} className="p-2 bg-blue-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">{getJobTypeLabel(job.jobType)}</span>
                    <Badge className={getJobStatusColor(job.jobStatus)} variant="secondary">
                      {job.jobStatus}
                    </Badge>
                  </div>
                  {job.progress !== undefined && <Progress value={job.progress} className="h-1" />}
                </div>
              ))}
            </div>
          )}

          {/* Recent Jobs */}
          {completedJobs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Recent Jobs</h4>
              <div className="space-y-1">
                {completedJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="text-xs font-medium text-gray-900">{getJobTypeLabel(job.jobType)}</div>
                      <div className="text-xs text-gray-500">
                        {job.completedAt && new Date(job.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={getJobStatusColor(job.jobStatus)} variant="secondary">
                      {job.jobStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Benefits */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>✓ Automated social media sharing</p>
            <p>✓ Smart donor engagement</p>
            <p>✓ Performance optimization</p>
            <p>✓ Content enhancement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
