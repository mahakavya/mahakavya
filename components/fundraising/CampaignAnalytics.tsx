"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/money"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Eye, Share2, Heart, MapPin, Clock } from "lucide-react"

interface CampaignAnalytics {
  overview: {
    totalViews: number
    totalShares: number
    totalDonations: number
    conversionRate: number
    avgDonation: number
    topReferrer: string
  }
  timeline: Array<{
    date: string
    views: number
    donations: number
    amount: number
  }>
  demographics: {
    ageGroups: Array<{ name: string; value: number }>
    locations: Array<{ name: string; value: number }>
    sources: Array<{ name: string; value: number }>
  }
  performance: {
    engagementRate: number
    shareRate: number
    returnVisitorRate: number
    avgSessionDuration: number
  }
}

interface CampaignAnalyticsProps {
  campaignId: string
}

export function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/analytics?range=${timeRange}`)
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId, timeRange])

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p>Analytics data not available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalDonations}</div>
            <div className="text-sm text-gray-600">Donations</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <CardContent className="p-4 text-center">
            <Share2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalShares}</div>
            <div className="text-sm text-gray-600">Shares</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-gray-900">
              {(analytics.overview.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Conversion</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
            <CardHeader>
              <CardTitle>Campaign Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" name="Views" />
                    <Line type="monotone" dataKey="donations" stroke="#82ca9d" name="Donations" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.demographics.locations.map((location, index) => (
                    <div key={location.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{location.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(location.value / analytics.demographics.locations[0].value) * 100}
                          className="w-16 h-2"
                        />
                        <span className="text-sm font-medium text-gray-900">{location.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.demographics.sources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.demographics.sources.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                      <span className="text-sm font-medium">
                        {(analytics.performance.engagementRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analytics.performance.engagementRate * 100} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Share Rate</span>
                      <span className="text-sm font-medium">{(analytics.performance.shareRate * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.performance.shareRate * 100} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Return Visitors</span>
                      <span className="text-sm font-medium">
                        {(analytics.performance.returnVisitorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={analytics.performance.returnVisitorRate * 100} />
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Avg. Session Duration</span>
                    <Badge variant="outline">
                      {Math.floor(analytics.performance.avgSessionDuration / 60)}m{" "}
                      {analytics.performance.avgSessionDuration % 60}s
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Key Insights</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Average donation amount: {formatINR(analytics.overview.avgDonation)}</p>
                  <p>• Top referrer: {analytics.overview.topReferrer}</p>
                  <p>
                    • Best performing day:{" "}
                    {
                      analytics.timeline.reduce(
                        (best, day) => (day.donations > best.donations ? day : best),
                        analytics.timeline[0],
                      )?.date
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
