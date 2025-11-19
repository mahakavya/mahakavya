"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, MessageSquare, Clock, Target, Download, RefreshCw, Activity } from "lucide-react"

interface GroupAnalyticsData {
  overview: {
    total_messages: number
    active_members: number
    engagement_rate: number
    response_time: number
    peak_hours: string[]
    growth_rate: number
  }
  engagement: {
    daily_messages: Array<{ date: string; count: number }>
    member_activity: Array<{ user_id: string; name: string; message_count: number; last_active: string }>
    popular_topics: Array<{ topic: string; mentions: number; sentiment: number }>
  }
  performance: {
    ai_insights_generated: number
    blockchain_verifications: number
    rpa_automations: number
    moderation_actions: number
    response_accuracy: number
    user_satisfaction: number
  }
  trends: {
    weekly_growth: number
    member_retention: number
    message_quality_score: number
    ai_enhancement_impact: number
  }
}

export function GroupAnalytics() {
  const [analytics, setAnalytics] = useState<GroupAnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState("7d")
  const [selectedMetric, setSelectedMetric] = useState("engagement")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/chat/groups/analytics?range=${timeRange}`)
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

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/chat/groups/analytics/export?range=${timeRange}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `group-analytics-${timeRange}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Group Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into group performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{analytics.overview.total_messages.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+{analytics.overview.growth_rate}%</span>
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Members</p>
                <p className="text-2xl font-bold">{analytics.overview.active_members}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">Last 24h</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold">{analytics.overview.engagement_rate}%</p>
                <Progress value={analytics.overview.engagement_rate} className="mt-2 h-1" />
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{analytics.overview.response_time}m</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Minutes</span>
                </div>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Message Activity</CardTitle>
                <CardDescription>Message volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.engagement.daily_messages.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            (day.count / Math.max(...analytics.engagement.daily_messages.map((d) => d.count))) * 100
                          }
                          className="w-24 h-2"
                        />
                        <span className="text-sm font-medium w-12 text-right">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
                <CardDescription>Most discussed topics with sentiment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.engagement.popular_topics.slice(0, 5).map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{topic.topic}</p>
                        <p className="text-sm text-muted-foreground">{topic.mentions} mentions</p>
                      </div>
                      <Badge
                        variant={
                          topic.sentiment > 0.6 ? "default" : topic.sentiment > 0.3 ? "secondary" : "destructive"
                        }
                      >
                        {topic.sentiment > 0.6 ? "Positive" : topic.sentiment > 0.3 ? "Neutral" : "Negative"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
              <CardDescription>When your group is most active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analytics.overview.peak_hours.map((hour, index) => (
                  <Badge key={index} variant="outline">
                    {hour}:00
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{analytics.performance.ai_insights_generated}</p>
                  <p className="text-sm text-muted-foreground">AI Insights Generated</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{analytics.performance.blockchain_verifications}</p>
                  <p className="text-sm text-muted-foreground">Blockchain Verifications</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{analytics.performance.rpa_automations}</p>
                  <p className="text-sm text-muted-foreground">RPA Automations</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{analytics.performance.moderation_actions}</p>
                  <p className="text-sm text-muted-foreground">Moderation Actions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Response Accuracy</CardTitle>
                <CardDescription>Quality of AI-generated responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Response Accuracy</span>
                    <span className="font-bold">{analytics.performance.response_accuracy}%</span>
                  </div>
                  <Progress value={analytics.performance.response_accuracy} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction</CardTitle>
                <CardDescription>Overall user satisfaction score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Satisfaction Score</span>
                    <span className="font-bold">{analytics.performance.user_satisfaction}%</span>
                  </div>
                  <Progress value={analytics.performance.user_satisfaction} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Members</CardTitle>
              <CardDescription>Top contributors in your groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.engagement.member_activity.slice(0, 10).map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last active: {new Date(member.last_active).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.message_count} messages</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Group growth and retention trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Weekly Growth</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-green-600">+{analytics.trends.weekly_growth}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Member Retention</span>
                  <span className="font-bold">{analytics.trends.member_retention}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Message Quality Score</span>
                  <span className="font-bold">{analytics.trends.message_quality_score}/10</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Enhancement Impact</CardTitle>
                <CardDescription>How AI features improve group experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Enhancement Score</span>
                    <span className="font-bold">{analytics.trends.ai_enhancement_impact}%</span>
                  </div>
                  <Progress value={analytics.trends.ai_enhancement_impact} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    AI features have improved group engagement by {analytics.trends.ai_enhancement_impact}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
