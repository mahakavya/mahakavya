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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Shield,
  AlertTriangle,
  Brain,
  Zap,
  Download,
  RefreshCw,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Activity,
  TrendingUp,
  Star,
  Flag,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Database,
  Bot,
} from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  phone?: string
  location?: string
  bio?: string
  status: "active" | "suspended" | "banned" | "pending"
  role: "user" | "moderator" | "admin" | "super_admin"
  is_verified: boolean
  subscription_status?: "free" | "premium" | "enterprise"
  created_at: string
  updated_at: string
  last_active?: string
  login_count: number
  content_count: number
  violation_count: number
  ai_risk_score: number
  blockchain_verified: boolean
  reputation_score: number
  engagement_rate: number
  referral_count: number
  total_spent: number
  preferences?: {
    notifications: boolean
    privacy_level: "public" | "private" | "friends"
    language: string
    theme: "light" | "dark" | "auto"
  }
  metadata?: {
    ip_address?: string
    user_agent?: string
    signup_source?: string
    verification_method?: string
    kyc_status?: "pending" | "verified" | "rejected"
  }
}

interface UserAnalytics {
  total_users: number
  active_users: number
  new_users_today: number
  suspended_users: number
  banned_users: number
  verified_users: number
  premium_users: number
  high_risk_users: number
  avg_engagement: number
  avg_reputation: number
}

interface AIInsight {
  user_id: string
  insight_type: "behavior_anomaly" | "engagement_pattern" | "risk_assessment" | "recommendation"
  severity: "low" | "medium" | "high" | "critical"
  title: string
  description: string
  confidence: number
  created_at: string
  actions_suggested: string[]
}

interface BulkAction {
  id: string
  action_type: "suspend" | "activate" | "verify" | "delete" | "send_notification"
  user_ids: string[]
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  created_at: string
  completed_at?: string
  results?: {
    success_count: number
    failure_count: number
    errors: string[]
  }
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    total_users: 0,
    active_users: 0,
    new_users_today: 0,
    suspended_users: 0,
    banned_users: 0,
    verified_users: 0,
    premium_users: 0,
    high_risk_users: 0,
    avg_engagement: 0,
    avg_reputation: 0,
  })
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([])
  const [bulkActions, setBulkActions] = useState<BulkAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState("")
  const [bulkActionReason, setBulkActionReason] = useState("")
  const { toast } = useToast()
  const { user: currentUser, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && currentUser) {
      loadUsers()
      loadAnalytics()
      loadAIInsights()
      loadBulkActions()

      // Set up real-time updates
      const interval = setInterval(() => {
        loadAnalytics()
        loadAIInsights()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [authLoading, currentUser, currentPage, sortBy, sortOrder])

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, statusFilter, roleFilter, verificationFilter])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Load users error:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/users/analytics")
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error("Load analytics error:", error)
    }
  }

  const loadAIInsights = async () => {
    try {
      const response = await fetch("/api/admin/users/ai-insights")
      const data = await response.json()

      if (data.success) {
        setAIInsights(data.data)
      }
    } catch (error) {
      console.error("Load AI insights error:", error)
    }
  }

  const loadBulkActions = async () => {
    try {
      const response = await fetch("/api/admin/users/bulk-actions")
      const data = await response.json()

      if (data.success) {
        setBulkActions(data.data)
      }
    } catch (error) {
      console.error("Load bulk actions error:", error)
    }
  }

  const applyFilters = () => {
    let filtered = users

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phone?.toLowerCase().includes(query) ||
          user.location?.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (verificationFilter !== "all") {
      if (verificationFilter === "verified") {
        filtered = filtered.filter((user) => user.is_verified)
      } else if (verificationFilter === "unverified") {
        filtered = filtered.filter((user) => !user.is_verified)
      } else if (verificationFilter === "blockchain_verified") {
        filtered = filtered.filter((user) => user.blockchain_verified)
      }
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (userId: string, action: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })
        loadUsers()
        loadAnalytics()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("User action error:", error)
      toast({
        title: "Error",
        description: "Failed to perform user action",
        variant: "destructive",
      })
    }
  }

  const handleBulkAction = async () => {
    if (selectedUsers.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select users to perform bulk action",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/users/bulk-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: bulkActionType,
          user_ids: Array.from(selectedUsers),
          reason: bulkActionReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Bulk action started successfully",
        })
        setIsBulkActionDialogOpen(false)
        setBulkActionType("")
        setBulkActionReason("")
        setSelectedUsers(new Set())
        loadBulkActions()
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
    }
  }

  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update user error:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    }
  }

  const startAIAnalysis = async (analysisType: string) => {
    try {
      const response = await fetch("/api/admin/users/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_type: analysisType }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "AI analysis started successfully",
        })
        loadAIInsights()
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
    }
  }

  const verifyUserBlockchain = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/blockchain-verify`, {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Blockchain verification initiated",
        })
        loadUsers()
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
        description: "Failed to initiate blockchain verification",
        variant: "destructive",
      })
    }
  }

  const exportUsers = async () => {
    try {
      const response = await fetch("/api/admin/users/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            status: statusFilter,
            role: roleFilter,
            verification: verificationFilter,
            search: searchQuery,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Create download link
        const blob = new Blob([data.csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `users_export_${format(new Date(), "yyyy-MM-dd")}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Users exported successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Error",
        description: "Failed to export users",
        variant: "destructive",
      })
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const selectAllVisible = () => {
    setSelectedUsers(new Set(filteredUsers.map((user) => user.id)))
  }

  const clearSelection = () => {
    setSelectedUsers(new Set())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "suspended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "banned":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "admin":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "moderator":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "user":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-red-600"
    if (score >= 60) return "text-orange-600"
    if (score >= 40) return "text-yellow-600"
    return "text-green-600"
  }

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Access Restricted
            </CardTitle>
            <CardDescription>You need to be logged in to access user management.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => (window.location.href = "/login")}>
              <Unlock className="w-4 h-4 mr-2" />
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
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced user administration with AI insights and blockchain verification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{analytics.new_users_today} today</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.active_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.active_users / analytics.total_users) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.verified_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((analytics.verified_users / analytics.total_users) * 100)}% verified
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.high_risk_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.avg_engagement.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Platform engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Bulk Actions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="blockchain_verified">Blockchain Verified</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Join Date</SelectItem>
                    <SelectItem value="last_active">Last Active</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="ai_risk_score">Risk Score</SelectItem>
                    <SelectItem value="reputation_score">Reputation</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} variant="outline" size="sm">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedUsers.size > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-900">
                      {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={selectAllVisible} size="sm" variant="outline">
                      Select All Visible
                    </Button>
                    <Button onClick={clearSelection} size="sm" variant="outline">
                      Clear Selection
                    </Button>
                    <Dialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Zap className="w-4 h-4 mr-2" />
                          Bulk Actions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Action</DialogTitle>
                          <DialogDescription>
                            Perform action on {selectedUsers.size} selected user{selectedUsers.size !== 1 ? "s" : ""}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="bulk-action-type">Action Type</Label>
                            <Select value={bulkActionType} onValueChange={setBulkActionType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="suspend">Suspend Users</SelectItem>
                                <SelectItem value="activate">Activate Users</SelectItem>
                                <SelectItem value="verify">Verify Users</SelectItem>
                                <SelectItem value="send_notification">Send Notification</SelectItem>
                                <SelectItem value="delete">Delete Users</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="bulk-action-reason">Reason (Optional)</Label>
                            <Textarea
                              id="bulk-action-reason"
                              value={bulkActionReason}
                              onChange={(e) => setBulkActionReason(e.target.value)}
                              placeholder="Enter reason for this action..."
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsBulkActionDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleBulkAction} disabled={!bulkActionType}>
                              Execute Action
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading users...</p>
              </div>
            ) : currentUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search criteria</p>
                </CardContent>
              </Card>
            ) : (
              currentUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        className="mt-1"
                      />

                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url || "/placeholder.svg"}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* User Info */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                              {user.name}
                              {user.is_verified && <Shield className="w-4 h-4 text-blue-500" />}
                              {user.blockchain_verified && <Database className="w-4 h-4 text-green-500" />}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                            {user.subscription_status && <Badge variant="outline">{user.subscription_status}</Badge>}
                          </div>
                        </div>

                        {/* User Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Joined</p>
                              <p className="font-medium">{format(new Date(user.created_at), "MMM dd, yyyy")}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Last Active</p>
                              <p className="font-medium">
                                {user.last_active
                                  ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                                  : "Never"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Content</p>
                              <p className="font-medium">{user.content_count}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-500">Reputation</p>
                              <p className="font-medium">{user.reputation_score}/100</p>
                            </div>
                          </div>
                        </div>

                        {/* AI Risk Score */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Brain className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium">AI Risk Assessment</span>
                            </div>
                            <span className={`text-sm font-bold ${getRiskColor(user.ai_risk_score)}`}>
                              {user.ai_risk_score}/100
                            </span>
                          </div>
                          <Progress value={user.ai_risk_score} className="h-2" />
                          {user.violation_count > 0 && (
                            <p className="text-xs text-red-600 mt-1">{user.violation_count} violations</p>
                          )}
                        </div>

                        {/* Additional Info */}
                        {(user.location || user.bio) && (
                          <div className="space-y-1">
                            {user.location && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {user.location}
                              </p>
                            )}
                            {user.bio && <p className="text-sm text-gray-600 line-clamp-2">{user.bio}</p>}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleUserAction(user.id, "activate")}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              disabled={user.status === "active"}
                            >
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activate
                            </Button>
                            <Button
                              onClick={() => handleUserAction(user.id, "suspend")}
                              size="sm"
                              variant="outline"
                              disabled={user.status === "suspended"}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspend
                            </Button>
                            <Button
                              onClick={() => handleUserAction(user.id, "ban")}
                              size="sm"
                              variant="destructive"
                              disabled={user.status === "banned"}
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Ban
                            </Button>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              onClick={() => verifyUserBlockchain(user.id)}
                              size="sm"
                              variant="outline"
                              disabled={user.blockchain_verified}
                            >
                              <Database className="w-4 h-4 mr-2" />
                              Blockchain Verify
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedUser(user)
                                setIsEditDialogOpen(true)
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="w-4 h-4" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of{" "}
                    {filteredUsers.length.toLocaleString()} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2)
                        return (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* AI Insights */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">AI Insights</h2>
            <div className="flex items-center gap-2">
              <Button onClick={() => startAIAnalysis("behavior_analysis")} size="sm">
                <Brain className="w-4 h-4 mr-2" />
                Behavior Analysis
              </Button>
              <Button onClick={() => startAIAnalysis("risk_assessment")} size="sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Risk Assessment
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {aiInsights.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No AI insights available</h3>
                  <p className="text-gray-600">Start an AI analysis to generate insights</p>
                </CardContent>
              </Card>
            ) : (
              aiInsights.map((insight) => (
                <Card key={insight.user_id + insight.created_at} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              insight.severity === "critical"
                                ? "bg-red-500"
                                : insight.severity === "high"
                                  ? "bg-orange-500"
                                  : insight.severity === "medium"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                            }`}
                          />
                          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                          <Badge
                            className={
                              insight.severity === "critical"
                                ? "bg-red-100 text-red-800"
                                : insight.severity === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : insight.severity === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                            }
                          >
                            {insight.severity}
                          </Badge>
                        </div>

                        <p className="text-gray-700">{insight.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Confidence: {(insight.confidence * 100).toFixed(1)}%</span>
                          <span>{formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}</span>
                        </div>

                        {insight.actions_suggested.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900">Suggested Actions:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {insight.actions_suggested.map((action, index) => (
                                <li key={index} className="text-sm text-gray-600">
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View User
                        </Button>
                        <Button size="sm">
                          <Bot className="w-4 h-4 mr-2" />
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Bulk Actions</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                <Activity className="w-3 h-3 mr-1" />
                {bulkActions.filter((action) => action.status === "processing").length} Running
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {bulkActions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bulk actions found</h3>
                  <p className="text-gray-600">Select users and perform bulk actions to see them here</p>
                </CardContent>
              </Card>
            ) : (
              bulkActions.map((action) => (
                <Card key={action.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            action.status === "completed"
                              ? "bg-green-500"
                              : action.status === "processing"
                                ? "bg-blue-500 animate-pulse"
                                : action.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                          }`}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {action.action_type.replace("_", " ").toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {action.user_ids.length} users •{" "}
                            {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge
                            className={
                              action.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : action.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : action.status === "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {action.status}
                          </Badge>
                          {action.status === "processing" && (
                            <div className="mt-2">
                              <Progress value={action.progress} className="h-2 w-24" />
                              <p className="text-xs text-gray-500 mt-1">{action.progress}%</p>
                            </div>
                          )}
                        </div>

                        {action.results && (
                          <div className="text-right text-sm">
                            <p className="text-green-600">Success: {action.results.success_count}</p>
                            <p className="text-red-600">Failed: {action.results.failure_count}</p>
                          </div>
                        )}

                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* User Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User registration trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">New Users Today</span>
                    <span className="font-bold text-blue-600">{analytics.new_users_today}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Active Users</span>
                    <span className="font-bold text-green-600">{analytics.active_users.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Premium Users</span>
                    <span className="font-bold text-purple-600">{analytics.premium_users.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Platform engagement and activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Engagement</span>
                      <span className="font-medium">{analytics.avg_engagement.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.avg_engagement} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Reputation</span>
                      <span className="font-medium">{analytics.avg_reputation.toFixed(1)}/100</span>
                    </div>
                    <Progress value={analytics.avg_reputation} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Verification Rate</span>
                      <span className="font-medium">
                        {Math.round((analytics.verified_users / analytics.total_users) * 100)}%
                      </span>
                    </div>
                    <Progress value={(analytics.verified_users / analytics.total_users) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and settings</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    defaultValue={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    defaultValue={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedUser.status}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, status: value as User["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={selectedUser.role}
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value as User["role"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  defaultValue={selectedUser.bio}
                  onChange={(e) => setSelectedUser({ ...selectedUser, bio: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-verified"
                  checked={selectedUser.is_verified}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, is_verified: checked as boolean })}
                />
                <Label htmlFor="edit-verified">Verified User</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateUser(selectedUser)}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
