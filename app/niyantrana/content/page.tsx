"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Flag,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  Play,
  FileText,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import type { ContentItem } from "@/lib/ai-content-service"
import type { AutomationJob } from "@/lib/rpa-content-service"
import { formatDistanceToNow } from "date-fns"

export default function ContentModerationPage() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [automationJobs, setAutomationJobs] = useState<AutomationJob[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    processingTime: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadContentItems()
    loadStats()
    loadAutomationJobs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [contentItems, searchQuery, statusFilter, riskFilter, typeFilter])

  const loadContentItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/content")
      const data = await response.json()

      if (data.success) {
        setContentItems(data.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load content items",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Load content error:", error)
      toast({
        title: "Error",
        description: "Failed to load content items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/content/stats")
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error("Load stats error:", error)
    }
  }

  const loadAutomationJobs = async () => {
    try {
      const response = await fetch("/api/admin/automation/jobs")
      const data = await response.json()

      if (data.success) {
        setAutomationJobs(data.data)
      }
    } catch (error) {
      console.error("Load jobs error:", error)
    }
  }

  const applyFilters = () => {
    let filtered = contentItems

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) => item.contentText?.toLowerCase().includes(query) || item.author?.name.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    if (riskFilter !== "all") {
      filtered = filtered.filter((item) => item.riskLevel === riskFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    setFilteredItems(filtered)
  }

  const handleModerateContent = async (contentId: string, action: "approve" | "reject" | "flag", reason?: string) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        loadContentItems()
        loadStats()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Moderation error:", error)
      toast({
        title: "Error",
        description: "Failed to moderate content",
        variant: "destructive",
      })
    }
  }

  const handleBulkModerate = async (action: "approve" | "reject" | "flag") => {
    if (selectedItems.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select items to moderate",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          contentIds: Array.from(selectedItems),
          reason: `Bulk ${action} action`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        setSelectedItems(new Set())
        loadContentItems()
        loadStats()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Bulk moderation error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk moderation",
        variant: "destructive",
      })
    }
  }

  const handleAnalyzeContent = async (contentId: string) => {
    try {
      const response = await fetch(`/api/admin/content/${contentId}/analyze`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Analysis Complete",
          description: `Risk Level: ${data.data.analysis.riskLevel}, Confidence: ${(data.data.analysis.confidence * 100).toFixed(1)}%`,
        })
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Error",
        description: "Failed to analyze content",
        variant: "destructive",
      })
    }
  }

  const startAutomationJob = async (jobType: string, parameters: any = {}) => {
    try {
      const response = await fetch("/api/admin/automation/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType, parameters }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Job Started",
          description: data.message,
        })
        loadAutomationJobs()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Job start error:", error)
      toast({
        title: "Error",
        description: "Failed to start automation job",
        variant: "destructive",
      })
    }
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItems(newSelection)
  }

  const selectAllVisible = () => {
    setSelectedItems(new Set(filteredItems.map((item) => item.id)))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "flagged":
        return "bg-orange-100 text-orange-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Control</h1>
          <p className="text-gray-600">AI-powered content moderation and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadContentItems} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => startAutomationJob("content_scan")} size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Quick Scan
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All content items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.riskDistribution.high + stats.riskDistribution.critical}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processingTime}s</div>
            <p className="text-xs text-muted-foreground">Average analysis time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((stats.approved / Math.max(stats.total, 1)) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Content approved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content Review</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                    <SelectItem value="critical">Critical Risk</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Content Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="reel">Reels</SelectItem>
                    <SelectItem value="comment">Comments</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button onClick={selectAllVisible} variant="outline" size="sm">
                    Select All
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleBulkModerate("approve")}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve All
                    </Button>
                    <Button onClick={() => handleBulkModerate("reject")} size="sm" variant="destructive">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject All
                    </Button>
                    <Button onClick={() => handleBulkModerate("flag")} size="sm" variant="outline">
                      <Flag className="w-4 h-4 mr-2" />
                      Flag All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading content...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No content items found</p>
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />

                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {item.type === "post" ? <FileText className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium">{item.author?.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className={getRiskBadgeColor(item.riskLevel)}>{item.riskLevel} risk</Badge>
                            <Badge className={getStatusBadgeColor(item.status)}>{item.status}</Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-2">
                          {item.contentText && <p className="text-gray-900 line-clamp-3">{item.contentText}</p>}

                          {item.mediaUrls && item.mediaUrls.length > 0 && (
                            <div className="flex space-x-2">
                              {item.mediaUrls.slice(0, 3).map((url, index) => (
                                <img
                                  key={index}
                                  src={url || "/placeholder.svg"}
                                  alt={`Media ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ))}
                              {item.mediaUrls.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-sm text-gray-600">+{item.mediaUrls.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* AI Score */}
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">AI Score:</span>
                          <Progress value={item.aiScore * 100} className="w-24 h-2" />
                          <span className="text-sm font-medium">{(item.aiScore * 100).toFixed(1)}%</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleModerateContent(item.id, "approve")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleModerateContent(item.id, "reject")}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button onClick={() => handleModerateContent(item.id, "flag")} size="sm" variant="outline">
                              <Flag className="w-4 h-4 mr-2" />
                              Flag
                            </Button>
                          </div>

                          <div className="flex space-x-2">
                            <Button onClick={() => handleAnalyzeContent(item.id)} size="sm" variant="outline">
                              <Brain className="w-4 h-4 mr-2" />
                              AI Analyze
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          {/* Automation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Bulk Moderation
                </CardTitle>
                <CardDescription>Automate content moderation at scale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() =>
                    startAutomationJob("bulk_moderation", {
                      contentIds: filteredItems.map((item) => item.id),
                      criteria: { autoApprove: true, riskThreshold: 0.3 },
                    })
                  }
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Bulk Moderation
                </Button>
                <p className="text-sm text-gray-600">Process {filteredItems.length} items with AI-powered decisions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Content Scan
                </CardTitle>
                <CardDescription>Comprehensive content analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() =>
                    startAutomationJob("content_scan", {
                      filters: { riskLevel: ["high", "critical"] },
                    })
                  }
                  className="w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Deep Content Scan
                </Button>
                <p className="text-sm text-gray-600">Analyze all content for policy violations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Duplicate Detection
                </CardTitle>
                <CardDescription>Find and manage duplicate content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() =>
                    startAutomationJob("duplicate_detection", {
                      contentType: "post",
                    })
                  }
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Detect Duplicates
                </Button>
                <p className="text-sm text-gray-600">Identify similar or duplicate content</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Jobs</CardTitle>
              <CardDescription>Monitor running and completed automation tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationJobs.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No automation jobs found</p>
                ) : (
                  automationJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              job.status === "completed"
                                ? "bg-green-500"
                                : job.status === "running"
                                  ? "bg-blue-500"
                                  : job.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                            }`}
                          />
                          <span className="font-medium">{job.jobType.replace("_", " ").toUpperCase()}</span>
                          <Badge variant="outline">{job.status}</Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {job.status === "running" && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}

                      {job.results && (
                        <div className="text-sm text-gray-600">
                          {job.jobType === "bulk_moderation" && (
                            <p>
                              Processed: {job.results.processed}, Approved: {job.results.approved}, Rejected:{" "}
                              {job.results.rejected}
                            </p>
                          )}
                          {job.jobType === "content_scan" && (
                            <p>
                              Scanned: {job.results.totalScanned}, Flagged: {job.results.flaggedItems}
                            </p>
                          )}
                          {job.jobType === "duplicate_detection" && (
                            <p>
                              Analyzed: {job.results.totalAnalyzed}, Duplicates: {job.results.duplicatesFound}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Content risk level breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.riskDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskBadgeColor(level).split(" ")[0]}`} />
                        <span className="capitalize">{level} Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getRiskBadgeColor(level).split(" ")[0]}`}
                            style={{ width: `${(count / Math.max(stats.total, 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moderation Performance</CardTitle>
                <CardDescription>Processing efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Processing Time</span>
                    <span className="font-medium">{stats.processingTime}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Approval Rate</span>
                    <span className="font-medium">
                      {Math.round((stats.approved / Math.max(stats.total, 1)) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-moderation Rate</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>False Positive Rate</span>
                    <span className="font-medium">2.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blockchain Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Blockchain Verification
              </CardTitle>
              <CardDescription>Content integrity and verification status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <p className="text-sm text-gray-600">Verification Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <p className="text-sm text-gray-600">Verified Items</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0.2s</div>
                  <p className="text-sm text-gray-600">Avg Verification Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
