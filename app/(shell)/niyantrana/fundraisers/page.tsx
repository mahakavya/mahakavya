"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  Heart,
  DollarSign,
  TrendingUp,
  MapPin,
  Eye,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  Shield,
  Download,
  Search,
  Share2,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  ImageIcon,
  Video,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface Campaign {
  id: string
  title: string
  description: string
  category: string
  targetAmount: number
  raisedAmount: number
  donorCount: number
  status: "draft" | "pending" | "active" | "paused" | "completed" | "rejected" | "flagged"
  priority: "low" | "medium" | "high" | "urgent"
  riskLevel: "low" | "medium" | "high" | "critical"
  aiScore: number
  blockchainVerified: boolean
  createdAt: string
  updatedAt: string
  endDate: string
  creator: {
    id: string
    name: string
    email: string
    avatar?: string
    verified: boolean
    reputation: number
  }
  location?: string
  images: string[]
  videos: string[]
  tags: string[]
  moderationNotes?: string
  lastModeratedAt?: string
  lastModeratedBy?: string
  analytics: {
    views: number
    shares: number
    engagement: number
    conversionRate: number
  }
}

interface CampaignStats {
  total: number
  pending: number
  active: number
  completed: number
  rejected: number
  flagged: number
  totalRaised: number
  averageAmount: number
  successRate: number
  processingTime: number
}

interface AIInsight {
  id: string
  campaignId: string
  type: "fraud_detection" | "success_prediction" | "optimization" | "risk_assessment"
  confidence: number
  findings: string[]
  recommendations: string[]
  severity: "info" | "warning" | "critical"
  createdAt: string
}

interface BlockchainRecord {
  id: string
  campaignId: string
  transactionHash: string
  blockNumber: number
  verificationStatus: "pending" | "verified" | "failed"
  integrityHash: string
  timestamp: string
}

export default function FundraisingAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<CampaignStats>({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    rejected: 0,
    flagged: 0,
    totalRaised: 0,
    averageAmount: 0,
    successRate: 0,
    processingTime: 0,
  })
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([])
  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [riskFilter, setRiskFilter] = useState("all")
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState("campaigns")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [moderationReason, setModerationReason] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      loadData()
      // Set up real-time updates
      const interval = setInterval(loadData, 30000)
      return () => clearInterval(interval)
    }
  }, [authLoading, user])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const [campaignsRes, statsRes, insightsRes, blockchainRes] = await Promise.all([
        fetch(
          `/api/admin/fundraising/campaigns?search=${searchQuery}&status=${statusFilter}&category=${categoryFilter}&risk=${riskFilter}`,
        ),
        fetch("/api/admin/fundraising/stats"),
        fetch("/api/admin/fundraising/ai-insights"),
        fetch("/api/admin/fundraising/blockchain-records"),
      ])

      const [campaignsData, statsData, insightsData, blockchainData] = await Promise.all([
        campaignsRes.json(),
        statsRes.json(),
        insightsRes.json(),
        blockchainRes.json(),
      ])

      if (campaignsData.success) setCampaigns(campaignsData.data)
      if (statsData.success) setStats(statsData.data)
      if (insightsData.success) setAIInsights(insightsData.data)
      if (blockchainData.success) setBlockchainRecords(blockchainData.data)
    } catch (error) {
      console.error("Load data error:", error)
      toast({
        title: "Error",
        description: "Failed to load fundraising data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleModerateCampaign = async (campaignId: string, action: "approve" | "reject" | "flag", reason?: string) => {
    try {
      const response = await fetch(`/api/admin/fundraising/campaigns/${campaignId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Campaign ${action}ed successfully`,
        })
        loadData()
        setSelectedCampaign(null)
        setModerationReason("")
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
        description: "Failed to moderate campaign",
        variant: "destructive",
      })
    }
  }

  const handleBulkAction = async (action: "approve" | "reject" | "flag" | "delete") => {
    if (selectedCampaigns.length === 0) {
      toast({
        title: "Warning",
        description: "Please select campaigns to perform bulk action",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessingBulk(true)

      const response = await fetch("/api/admin/fundraising/campaigns/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignIds: selectedCampaigns,
          action,
          reason: moderationReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Bulk ${action} completed: ${data.processed} campaigns processed`,
        })
        setSelectedCampaigns([])
        setModerationReason("")
        loadData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Bulk action error:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleAIAnalysis = async (campaignId?: string) => {
    try {
      setIsAnalyzing(true)

      const response = await fetch("/api/admin/fundraising/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId || null,
          analysisType: "comprehensive",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "AI analysis started successfully",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("AI analysis error:", error)
      toast({
        title: "Error",
        description: "Failed to start AI analysis",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleBlockchainVerification = async (campaignId: string) => {
    try {
      setIsVerifying(true)

      const response = await fetch(`/api/admin/fundraising/campaigns/${campaignId}/blockchain-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Blockchain verification initiated",
        })
        loadData()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Blockchain verification error:", error)
      toast({
        title: "Error",
        description: "Failed to verify on blockchain",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/admin/fundraising/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: { status: statusFilter, category: categoryFilter, risk: riskFilter },
          format: "csv",
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `fundraising-campaigns-${format(new Date(), "yyyy-MM-dd")}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Data exported successfully",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "rejected":
      case "flagged":
        return "text-red-600 bg-red-100"
      case "paused":
        return "text-gray-600 bg-gray-100"
      default:
        return "text-blue-600 bg-blue-100"
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "text-green-600 bg-green-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "high":
        return "text-orange-600 bg-orange-100"
      case "critical":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100"
      case "high":
        return "text-orange-600 bg-orange-100"
      case "medium":
        return "text-yellow-600 bg-yellow-100"
      case "low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesCategory = categoryFilter === "all" || campaign.category === categoryFilter
    const matchesRisk = riskFilter === "all" || campaign.riskLevel === riskFilter

    return matchesSearch && matchesStatus && matchesCategory && matchesRisk
  })

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Access Restricted
            </CardTitle>
            <CardDescription>You need admin access to manage fundraising campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/login")}>
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-600" />
            Fundraising Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">AI-powered campaign management and fraud detection</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleAIAnalysis()} size="sm" disabled={isAnalyzing}>
            <Brain className={`w-4 h-4 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`} />
            AI Analysis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.pending} pending review</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRaised)}</div>
            <p className="text-xs text-muted-foreground">Avg: {formatCurrency(stats.averageAmount)}</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processingTime}h</div>
            <p className="text-xs text-muted-foreground">average review time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="blockchain" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Blockchain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="disaster">Disaster Relief</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCampaigns.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{selectedCampaigns.length} selected</span>
                <Button onClick={() => handleBulkAction("approve")} size="sm" disabled={isProcessingBulk}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleBulkAction("reject")}
                  size="sm"
                  variant="destructive"
                  disabled={isProcessingBulk}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleBulkAction("flag")}
                  size="sm"
                  variant="outline"
                  disabled={isProcessingBulk}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Flag
                </Button>
              </div>
            )}
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedCampaigns.includes(campaign.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCampaigns([...selectedCampaigns, campaign.id])
                        } else {
                          setSelectedCampaigns(selectedCampaigns.filter((id) => id !== campaign.id))
                        }
                      }}
                    />

                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold line-clamp-1">{campaign.title}</h3>
                            {campaign.blockchainVerified && (
                              <Shield className="w-4 h-4 text-green-600" title="Blockchain Verified" />
                            )}
                            {campaign.creator.verified && (
                              <CheckCircle className="w-4 h-4 text-blue-600" title="Verified Creator" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>by {campaign.creator.name}</span>
                            <span>•</span>
                            <span>{campaign.category}</span>
                            {campaign.location && (
                              <>
                                <span>•</span>
                                <MapPin className="w-3 h-3" />
                                <span>{campaign.location}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                          <Badge className={getRiskColor(campaign.riskLevel)}>{campaign.riskLevel} risk</Badge>
                          <Badge className={getPriorityColor(campaign.priority)}>{campaign.priority}</Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-700 line-clamp-2">{campaign.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            {formatCurrency(campaign.raisedAmount)} raised of {formatCurrency(campaign.targetAmount)}
                          </span>
                          <span className="text-gray-600">
                            {Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%
                          </span>
                        </div>
                        <Progress value={(campaign.raisedAmount / campaign.targetAmount) * 100} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{campaign.donorCount} donors</span>
                          <span>Ends {formatDistanceToNow(new Date(campaign.endDate), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* AI Score and Analytics */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span>AI Score: {(campaign.aiScore * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-600" />
                            <span>{campaign.analytics.views.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Share2 className="w-4 h-4 text-gray-600" />
                            <span>{campaign.analytics.shares} shares</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-gray-600" />
                            <span>{campaign.analytics.conversionRate}% conversion</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Moderation Notes */}
                      {campaign.moderationNotes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Moderation Notes</p>
                              <p className="text-sm text-yellow-700">{campaign.moderationNotes}</p>
                              {campaign.lastModeratedBy && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  By {campaign.lastModeratedBy} •{" "}
                                  {formatDistanceToNow(new Date(campaign.lastModeratedAt!), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedCampaign(campaign)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Heart className="w-5 h-5 text-red-600" />
                              Campaign Details
                            </DialogTitle>
                            <DialogDescription>Review and moderate this fundraising campaign</DialogDescription>
                          </DialogHeader>

                          {selectedCampaign && (
                            <div className="space-y-6">
                              {/* Campaign Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold text-lg">{selectedCampaign.title}</h3>
                                    <p className="text-gray-600">{selectedCampaign.description}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Category:</span>
                                      <p>{selectedCampaign.category}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium">Location:</span>
                                      <p>{selectedCampaign.location || "Not specified"}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium">Target:</span>
                                      <p>{formatCurrency(selectedCampaign.targetAmount)}</p>
                                    </div>
                                    <div>
                                      <span className="font-medium">Raised:</span>
                                      <p>{formatCurrency(selectedCampaign.raisedAmount)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <span className="font-medium">Creator:</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                                        {selectedCampaign.creator.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-medium">{selectedCampaign.creator.name}</p>
                                        <p className="text-sm text-gray-600">{selectedCampaign.creator.email}</p>
                                      </div>
                                      {selectedCampaign.creator.verified && (
                                        <CheckCircle className="w-4 h-4 text-blue-600" />
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Status:</span>
                                      <Badge className={getStatusColor(selectedCampaign.status)}>
                                        {selectedCampaign.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="font-medium">Risk Level:</span>
                                      <Badge className={getRiskColor(selectedCampaign.riskLevel)}>
                                        {selectedCampaign.riskLevel}
                                      </Badge>
                                    </div>
                                    <div>
                                      <span className="font-medium">AI Score:</span>
                                      <p>{(selectedCampaign.aiScore * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                      <span className="font-medium">Blockchain:</span>
                                      <p>{selectedCampaign.blockchainVerified ? "Verified" : "Pending"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Media */}
                              {(selectedCampaign.images.length > 0 || selectedCampaign.videos.length > 0) && (
                                <div>
                                  <h4 className="font-medium mb-2">Media</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {selectedCampaign.images.map((image, index) => (
                                      <div
                                        key={index}
                                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                                      >
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                      </div>
                                    ))}
                                    {selectedCampaign.videos.map((video, index) => (
                                      <div
                                        key={index}
                                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                                      >
                                        <Video className="w-8 h-8 text-gray-400" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Moderation */}
                              <div className="space-y-4">
                                <h4 className="font-medium">Moderation Actions</h4>
                                <Textarea
                                  placeholder="Add moderation notes..."
                                  value={moderationReason}
                                  onChange={(e) => setModerationReason(e.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() =>
                                      handleModerateCampaign(selectedCampaign.id, "approve", moderationReason)
                                    }
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleModerateCampaign(selectedCampaign.id, "reject", moderationReason)
                                    }
                                    variant="destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleModerateCampaign(selectedCampaign.id, "flag", moderationReason)
                                    }
                                    variant="outline"
                                  >
                                    <Flag className="w-4 h-4 mr-2" />
                                    Flag
                                  </Button>
                                  <Button
                                    onClick={() => handleAIAnalysis(selectedCampaign.id)}
                                    variant="outline"
                                    disabled={isAnalyzing}
                                  >
                                    <Brain className={`w-4 h-4 mr-2 ${isAnalyzing ? "animate-pulse" : ""}`} />
                                    AI Analysis
                                  </Button>
                                  <Button
                                    onClick={() => handleBlockchainVerification(selectedCampaign.id)}
                                    variant="outline"
                                    disabled={isVerifying}
                                  >
                                    <Shield className={`w-4 h-4 mr-2 ${isVerifying ? "animate-pulse" : ""}`} />
                                    Blockchain Verify
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={() => handleModerateCampaign(campaign.id, "approve")}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleModerateCampaign(campaign.id, "reject")}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleModerateCampaign(campaign.id, "flag")} size="sm" variant="outline">
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Campaign Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active</span>
                    <span className="font-medium">{stats.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Pending</span>
                    <span className="font-medium">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium">{stats.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rejected</span>
                    <span className="font-medium">{stats.rejected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Flagged</span>
                    <span className="font-medium">{stats.flagged}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className="font-medium">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Processing Time</span>
                      <span className="font-medium">{stats.processingTime}h</span>
                    </div>
                    <Progress value={Math.min(((24 - stats.processingTime) / 24) * 100, 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Platform Health</span>
                      <span className="font-medium">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Total Raised</span>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRaised)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Average Campaign</span>
                    <p className="text-lg font-semibold">{formatCurrency(stats.averageAmount)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Platform Fee</span>
                    <p className="text-lg font-semibold">{formatCurrency(stats.totalRaised * 0.05)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <Card key={insight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold">{insight.type.replace("_", " ").toUpperCase()}</h3>
                        <Badge
                          className={
                            insight.severity === "critical"
                              ? "bg-red-100 text-red-800"
                              : insight.severity === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {insight.severity}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Confidence: {(insight.confidence * 100).toFixed(1)}%
                        </span>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Findings:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {insight.findings.map((finding, index) => (
                            <li key={index}>{finding}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {insight.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-xs text-gray-500">
                        Generated {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <div className="space-y-4">
            {blockchainRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          record.verificationStatus === "verified"
                            ? "bg-green-500"
                            : record.verificationStatus === "pending"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium font-mono">{record.transactionHash}</p>
                        <p className="text-sm text-gray-600">Block #{record.blockNumber}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge
                        className={
                          record.verificationStatus === "verified"
                            ? "bg-green-100 text-green-800"
                            : record.verificationStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {record.verificationStatus}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
