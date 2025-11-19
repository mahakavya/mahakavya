"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Shield, Zap, Brain } from "lucide-react"

interface EventPattern {
  id: string
  name: string
  count: number
  trend: "up" | "down" | "stable"
  category: string
}

export default function EventAnalyticsPage() {
  const [eventPatterns, setEventPatterns] = useState<EventPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState("idle")
  const [automationStatus, setAutomationStatus] = useState("idle")

  useEffect(() => {
    // Simulate fetching event patterns
    const mockPatterns: EventPattern[] = [
      { id: "1", name: "User Signups", count: 245, trend: "up", category: "authentication" },
      { id: "2", name: "Post Creations", count: 1834, trend: "up", category: "content" },
      { id: "3", name: "Failed Logins", count: 23, trend: "down", category: "security" },
      { id: "4", name: "Payment Transactions", count: 156, trend: "stable", category: "billing" },
      { id: "5", name: "Content Reports", count: 12, trend: "down", category: "moderation" },
    ]

    setEventPatterns(mockPatterns)
    setLoading(false)
  }, [])

  const predictFutureTrends = async () => {
    setLoading(true)
    // Simulate AI prediction
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update patterns with predictions
    const updatedPatterns = eventPatterns.map((pattern) => ({
      ...pattern,
      count: pattern.count + Math.floor(Math.random() * 50) - 25,
      trend: Math.random() > 0.5 ? "up" : ("down" as "up" | "down"),
    }))

    setEventPatterns(updatedPatterns)
    setLoading(false)
  }

  const handleVerification = async () => {
    setVerificationStatus("running")
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setVerificationStatus("completed")

    setTimeout(() => setVerificationStatus("idle"), 2000)
  }

  const handleAutomation = async () => {
    setAutomationStatus("running")
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setAutomationStatus("completed")

    setTimeout(() => setAutomationStatus("idle"), 2000)
  }

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? "↗️" : trend === "down" ? "↘️" : "➡️"
  }

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Analytics Dashboard</h1>
          <p className="text-gray-600">AI-powered insights into platform events and patterns</p>
        </div>
        <Button onClick={predictFutureTrends} disabled={loading}>
          <Brain className="mr-2 h-4 w-4" />
          Predict Trends
        </Button>
      </div>

      {/* Event Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventPatterns.map((pattern) => (
          <Card key={pattern.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                {pattern.name}
                <span className={`text-2xl ${getTrendColor(pattern.trend)}`}>{getTrendIcon(pattern.trend)}</span>
              </CardTitle>
              <CardDescription>
                <Badge variant="outline">{pattern.category}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pattern.count.toLocaleString()}</div>
              <div className={`text-sm ${getTrendColor(pattern.trend)}`}>
                {pattern.trend === "up" ? "Increasing" : pattern.trend === "down" ? "Decreasing" : "Stable"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>Verify event data integrity using blockchain technology</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleVerification} disabled={verificationStatus === "running"} className="w-full">
              {verificationStatus === "running" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying Events...
                </>
              ) : verificationStatus === "completed" ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verification Complete ✓
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Events
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RPA Automation
            </CardTitle>
            <CardDescription>Automate event reporting and analysis workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleAutomation} disabled={automationStatus === "running"} className="w-full">
              {automationStatus === "running" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Automating Reports...
                </>
              ) : automationStatus === "completed" ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Automation Complete ✓
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Automate Reporting
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {eventPatterns.reduce((sum, p) => sum + p.count, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {eventPatterns.filter((p) => p.trend === "up").length}
              </div>
              <div className="text-sm text-gray-600">Trending Up</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {eventPatterns.filter((p) => p.trend === "down").length}
              </div>
              <div className="text-sm text-gray-600">Trending Down</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {eventPatterns.filter((p) => p.trend === "stable").length}
              </div>
              <div className="text-sm text-gray-600">Stable</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
