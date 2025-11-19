"use client"

import { useState, useEffect } from "react"
import { BarChart3, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ReelsAnalytics {
  totalViews: number
  totalLikes: number
  totalShares: number
  engagementRate: number
  averageWatchTime: number
  topPerformingTime: string
  audienceRetention: number
  growthRate: number
}

export function ReelsAnalytics() {
  const [analytics, setAnalytics] = useState<ReelsAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/reels/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Your Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-700 rounded animate-pulse" />
                <div className="h-6 bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Your Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            No analytics data available yet. Create some reels to see your performance!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5" />
          Your Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Views</p>
            <p className="text-white text-xl font-bold">{formatNumber(analytics.totalViews)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Likes</p>
            <p className="text-white text-xl font-bold">{formatNumber(analytics.totalLikes)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Engagement Rate</p>
            <p className="text-white text-xl font-bold">{analytics.engagementRate.toFixed(1)}%</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Avg Watch Time</p>
            <p className="text-white text-xl font-bold">{formatTime(analytics.averageWatchTime)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Audience Retention</span>
              <span className="text-sm text-white">{analytics.audienceRetention}%</span>
            </div>
            <Progress value={analytics.audienceRetention} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Growth Rate</span>
              <span className="text-sm text-white flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {analytics.growthRate > 0 ? "+" : ""}
                {analytics.growthRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={Math.abs(analytics.growthRate)} className="h-2" />
          </div>

          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Best Time to Post
              </span>
              <span className="text-sm text-white font-medium">{analytics.topPerformingTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
