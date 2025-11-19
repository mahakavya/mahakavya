"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Brain,
  Shield,
  Zap,
  Download,
  RefreshCw,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Database,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    churnRate: number
    avgSessionDuration: number
    totalRevenue: number
    subscriptions: number
    engagementRate: number
  }
  engagement: {
    posts: number
    likes: number
    comments: number
    shares: number
    viewTime: number
    bounceRate: number
  }
  devices: {
    mobile: number
    desktop: number
    tablet: number
  }
  locations: Array<{
    country: string
    users: number
    revenue: number
  }>
  aiInsights: {
    userBehaviorScore: number
    contentQualityScore: number
    riskAssessment: string
    predictions: {
      userGrowth: number
      revenueGrowth: number
      churnPrediction: number
    }
    recommendations: string[]
  }
  blockchainMetrics: {
    totalTransactions: number
    verifiedContent: number
    securityScore: number
    integrityChecks: number
  }
  rpaJobs: {
    completed: number
    running: number
    failed: number
    efficiency: number
  }
}

interface RealtimeMetric {
  timestamp: string
  activeUsers: number
  newSignups: number
  revenue: number
  errors: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState("7d")
  const [selectedMetric, setSelectedMetric] = useState("users")
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalyticsData()
    const interval = setInterval(() => {
      fetchRealtimeData()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [dateRange])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/overview?range=${dateRange}`)
      if (!response.ok) throw new Error("Failed to fetch analytics")
      const data = await response.json()
      setAnalyticsData(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch("/api/admin/analytics/realtime")
      if (!response.ok) throw new Error("Failed to fetch realtime data")
      const data = await response.json()
      setRealtimeData((prev) => [...prev.slice(-23), data])
    } catch (error) {
      console.error("Error fetching realtime data:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalyticsData()
    await fetchRealtimeData()
    setRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Analytics data has been updated",
    })
  }

  const runAIAnalysis = async () => {
    try {
      setAiAnalysisLoading(true)
      const response = await fetch("/api/admin/analytics/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range: dateRange }),
      })

      if (!response.ok) throw new Error("Failed to run AI analysis")

      const insights = await response.json()
      setAnalyticsData((prev) => (prev ? { ...prev, aiInsights: insights } : null))

      toast({
        title: "AI Analysis Complete",
        description: "New insights have been generated",
      })
    } catch (error) {
      console.error("Error running AI analysis:", error)
      toast({
        title: "Error",
        description: "Failed to run AI analysis",
        variant: "destructive",
      })
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  const exportData = async () => {
    try {
      setExportLoading(true)
      const response = await fetch(`/api/admin/analytics/export?range=${dateRange}&format=csv`)

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Complete",
        description: "Analytics data has been downloaded",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Vivechana Analytics</h1>
            <p className="text-muted-foreground">Advanced platform analytics and insights</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load analytics data. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Vivechana Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive platform analytics with AI insights and blockchain verification
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last Day</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={runAIAnalysis}
            disabled={aiAnalysisLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
          >
            <Brain className={`h-4 w-4 mr-2 ${aiAnalysisLoading ? "animate-pulse" : ""}`} />
            AI Analysis
          </Button>
          <Button onClick={exportData} disabled={exportLoading}>
            <Download className={`h-4 w-4 mr-2 ${exportLoading ? "animate-bounce" : ""}`} />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analyticsData.overview.newUsers}</span> new this period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((analyticsData.overview.activeUsers / analyticsData.overview.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analyticsData.overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{analyticsData.overview.subscriptions} subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(analyticsData.overview.avgSessionDuration / 60)} min avg session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {analyticsData.aiInsights && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Advanced analytics powered by machine learning algorithms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Behavior Score</span>
                  <Badge variant="secondary">{analyticsData.aiInsights.userBehaviorScore}/100</Badge>
                </div>
                <Progress value={analyticsData.aiInsights.userBehaviorScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Content Quality</span>
                  <Badge variant="secondary">{analyticsData.aiInsights.contentQualityScore}/100</Badge>
                </div>
                <Progress value={analyticsData.aiInsights.contentQualityScore} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Assessment</span>
                  <Badge
                    variant={
                      analyticsData.aiInsights.riskAssessment === "LOW"
                        ? "default"
                        : analyticsData.aiInsights.riskAssessment === "MEDIUM"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {analyticsData.aiInsights.riskAssessment}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  +{analyticsData.aiInsights.predictions.userGrowth}%
                </div>
                <div className="text-sm text-muted-foreground">Predicted User Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  +{analyticsData.aiInsights.predictions.revenueGrowth}%
                </div>
                <div className="text-sm text-muted-foreground">Revenue Growth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analyticsData.aiInsights.predictions.churnPrediction}%
                </div>
                <div className="text-sm text-muted-foreground">Churn Risk</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">AI Recommendations:</h4>
              <ul className="space-y-1">
                {analyticsData.aiInsights.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Target className="h-3 w-3 mt-1 text-purple-600" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="rpa">RPA Jobs</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">{analyticsData.overview.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span className="font-medium text-green-600">
                      {analyticsData.overview.activeUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Users</span>
                    <span className="font-medium text-blue-600">
                      {analyticsData.overview.newUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn Rate</span>
                    <span className="font-medium text-red-600">{analyticsData.overview.churnRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-medium">₹{analyticsData.overview.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subscriptions</span>
                    <span className="font-medium text-green-600">
                      {analyticsData.overview.subscriptions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ARPU</span>
                    <span className="font-medium">
                      ₹{(analyticsData.overview.totalRevenue / analyticsData.overview.totalUsers).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium text-blue-600">
                      {((analyticsData.overview.subscriptions / analyticsData.overview.totalUsers) * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Content Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Posts Created
                    </div>
                    <Badge variant="secondary">{analyticsData.engagement.posts.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Total Likes
                    </div>
                    <Badge variant="secondary">{analyticsData.engagement.likes.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments
                    </div>
                    <Badge variant="secondary">{analyticsData.engagement.comments.toLocaleString()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Shares
                    </div>
                    <Badge variant="secondary">{analyticsData.engagement.shares.toLocaleString()}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Avg View Time</span>
                    <span className="font-medium">{Math.round(analyticsData.engagement.viewTime / 60)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-medium text-orange-600">
                      {analyticsData.engagement.bounceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engagement Rate</span>
                    <span className="font-medium text-green-600">
                      {analyticsData.overview.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Mobile
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(analyticsData.devices.mobile / analyticsData.overview.totalUsers) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">{analyticsData.devices.mobile.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(analyticsData.devices.desktop / analyticsData.overview.totalUsers) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">{analyticsData.devices.desktop.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Tablet
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(analyticsData.devices.tablet / analyticsData.overview.totalUsers) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">{analyticsData.devices.tablet.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.locations.slice(0, 5).map((location, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{location.country}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{location.users.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">₹{location.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blockchain Tab */}
        <TabsContent value="blockchain" className="space-y-6">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Blockchain Analytics
              </CardTitle>
              <CardDescription>Security and integrity metrics powered by blockchain technology</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.blockchainMetrics.totalTransactions.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.blockchainMetrics.verifiedContent.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Verified Content</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.blockchainMetrics.securityScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Security Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData.blockchainMetrics.integrityChecks.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Integrity Checks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RPA Tab */}
        <TabsContent value="rpa" className="space-y-6">
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                RPA Job Analytics
              </CardTitle>
              <CardDescription>Robotic Process Automation performance and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{analyticsData.rpaJobs.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed Jobs</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.rpaJobs.running}</div>
                    <div className="text-sm text-muted-foreground">Running Jobs</div>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{analyticsData.rpaJobs.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed Jobs</div>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{analyticsData.rpaJobs.efficiency}%</div>
                    <div className="text-sm text-muted-foreground">Efficiency Rate</div>
                  </div>
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 animate-pulse" />
                Real-time Metrics
              </CardTitle>
              <CardDescription>Live platform activity and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {realtimeData.length > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {realtimeData[realtimeData.length - 1]?.activeUsers || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Users Now</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {realtimeData[realtimeData.length - 1]?.newSignups || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">New Signups Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{realtimeData[realtimeData.length - 1]?.revenue?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Revenue Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {realtimeData[realtimeData.length - 1]?.errors || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Errors/Hour</div>
                    </div>
                  </>
                )}
              </div>

              {realtimeData.length === 0 && (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading real-time data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
