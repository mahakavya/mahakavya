"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, MessageSquare, Heart, TrendingUp, Brain, Shield, Zap, BarChart3 } from "lucide-react"

interface OverviewStats {
  totalUsers: number
  activeUsers: number
  totalPosts: number
  totalLikes: number
  engagementRate: number
  aiInsights: string[]
  blockchainStatus: "healthy" | "warning" | "error"
  rpaJobsCompleted: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching overview data
    setTimeout(() => {
      setStats({
        totalUsers: 15432,
        activeUsers: 4321,
        totalPosts: 67890,
        totalLikes: 234567,
        engagementRate: 82.3,
        aiInsights: [
          "Peak activity hours: 7-9 PM IST",
          "Spiritual content engagement up 25%",
          "Mobile users: 73% of total traffic",
        ],
        blockchainStatus: "healthy",
        rpaJobsCompleted: 1247,
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading || !stats) {
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
          <h1 className="text-3xl font-bold">Admin Overview Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform insights with AI, Blockchain, and RPA integration</p>
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
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Total Likes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +22% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Driven Insights
          </CardTitle>
          <CardDescription>Machine learning analysis of platform patterns and user behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Brain className="h-4 w-4 text-blue-600 mt-0.5" />
                <span className="text-sm">{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Network Health:</span>
              <Badge variant={stats.blockchainStatus === "healthy" ? "default" : "destructive"}>
                {stats.blockchainStatus}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-gray-600">All transactions verified and secure</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RPA Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>Jobs Completed:</span>
              <Badge variant="outline">{stats.rpaJobsCompleted}</Badge>
            </div>
            <div className="mt-2 text-sm text-gray-600">Automation running smoothly</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.engagementRate}%</div>
            <div className="text-sm text-gray-600">Above industry average</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-xs">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <MessageSquare className="h-6 w-6 mb-2" />
              <span className="text-xs">Content Moderation</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-xs">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Shield className="h-6 w-6 mb-2" />
              <span className="text-xs">Security Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
