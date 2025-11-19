"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Shield, Zap, BarChart3, Users, TrendingUp } from "lucide-react"

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  engagementRate: number
  aiInsights: string[]
  blockchainStatus: "healthy" | "warning" | "error"
  rpaJobs: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false)
  const [blockchainVerifying, setBlockchainVerifying] = useState(false)
  const [rpaRunning, setRpaRunning] = useState(false)

  useEffect(() => {
    // Simulate fetching analytics data
    setTimeout(() => {
      setData({
        totalUsers: 12543,
        activeUsers: 3421,
        totalPosts: 45678,
        engagementRate: 78.5,
        aiInsights: [
          "User engagement peaks at 7-9 PM",
          "Spiritual content shows 23% higher engagement",
          "Mobile users comprise 67% of active sessions",
        ],
        blockchainStatus: "healthy",
        rpaJobs: 156,
      })
      setLoading(false)
    }, 1000)
  }, [])

  const generateAIInsights = async () => {
    setAiInsightsLoading(true)
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    if (data) {
      setData({
        ...data,
        aiInsights: [
          ...data.aiInsights,
          "New trend detected: Community discussions increasing by 15%",
          "Recommendation: Optimize content delivery for evening hours",
        ],
      })
    }
    setAiInsightsLoading(false)
  }

  const verifyBlockchainData = async () => {
    setBlockchainVerifying(true)
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2500))

    if (data) {
      setData({
        ...data,
        blockchainStatus: "healthy",
      })
    }
    setBlockchainVerifying(false)
  }

  const runRPAAutomation = async () => {
    setRpaRunning(true)
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (data) {
      setData({
        ...data,
        rpaJobs: data.rpaJobs + Math.floor(Math.random() * 10) + 1,
      })
    }
    setRpaRunning(false)
  }

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform insights with AI, Blockchain, and RPA</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPosts.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagementRate}%</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +3.2% from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Driven Insights
          </CardTitle>
          <CardDescription>Machine learning analysis of platform patterns and user behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {data.aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                <span className="text-sm">{insight}</span>
              </div>
            ))}
          </div>
          <Button onClick={generateAIInsights} disabled={aiInsightsLoading}>
            {aiInsightsLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Insights...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate New Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Blockchain & RPA Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>Data integrity and security verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>System Status:</span>
              <Badge variant={data.blockchainStatus === "healthy" ? "default" : "destructive"}>
                {data.blockchainStatus}
              </Badge>
            </div>
            <Button onClick={verifyBlockchainData} disabled={blockchainVerifying} className="w-full">
              {blockchainVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Data Integrity
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
            <CardDescription>Automated processes and workflow management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span>Jobs Completed:</span>
              <Badge variant="outline">{data.rpaJobs}</Badge>
            </div>
            <Button onClick={runRPAAutomation} disabled={rpaRunning} className="w-full">
              {rpaRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running Automation...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Automation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
