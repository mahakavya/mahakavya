"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Clock, Star, Calendar, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface SessionAnalyticsProps {
  userId: string
}

interface AnalyticsData {
  totalSessions: number
  completedSessions: number
  averageRating: number
  totalHours: number
  monthlyTrend: {
    month: string
    sessions: number
    hours: number
  }[]
  topSpecializations: {
    name: string
    count: number
    percentage: number
  }[]
  sessionTypes: {
    video: number
    audio: number
    chat: number
  }
  satisfactionScore: number
  improvementAreas: string[]
  achievements: {
    name: string
    description: string
    earned: boolean
  }[]
}

export function SessionAnalytics({ userId }: SessionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [userId])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/sahaya/sessions/analytics?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Complete more sessions to see your analytics.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((analytics.completedSessions / analytics.totalSessions) * 100)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.averageRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalHours}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.satisfactionScore}%</p>
              </div>
              <PieChart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Monthly Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{month.month}</span>
                    <span className="text-sm text-gray-600">
                      {month.sessions} sessions • {month.hours}h
                    </span>
                  </div>
                  <Progress
                    value={(month.sessions / Math.max(...analytics.monthlyTrend.map((m) => m.sessions))) * 100}
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Specializations */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardHeader>
            <CardTitle>Top Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topSpecializations.map((spec, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{spec.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{spec.count}</span>
                    <Badge variant="outline">{spec.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Types */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardHeader>
            <CardTitle>Session Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Video Calls</span>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(analytics.sessionTypes.video / analytics.totalSessions) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm text-gray-600">{analytics.sessionTypes.video}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Audio Calls</span>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(analytics.sessionTypes.audio / analytics.totalSessions) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm text-gray-600">{analytics.sessionTypes.audio}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Chat Sessions</span>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={(analytics.sessionTypes.chat / analytics.totalSessions) * 100}
                    className="w-20 h-2"
                  />
                  <span className="text-sm text-gray-600">{analytics.sessionTypes.chat}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  achievement.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <h4 className={`font-semibold ${achievement.earned ? "text-green-800" : "text-gray-600"}`}>
                  {achievement.name}
                </h4>
                <p className={`text-sm ${achievement.earned ? "text-green-600" : "text-gray-500"}`}>
                  {achievement.description}
                </p>
                {achievement.earned && <Badge className="mt-2 bg-green-100 text-green-800">Earned</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Areas */}
      {analytics.improvementAreas.length > 0 && (
        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
