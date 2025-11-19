"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TrendingUp,
  Clock,
  Users,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Brain,
  Shield,
  Zap,
} from "lucide-react"
import { InfiniteFeed } from "./InfiniteFeed"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { monitoring } from "@/lib/monitoring"

interface FeedStats {
  forYou: number
  trending: number
  following: number
  recent: number
}

interface FilterOptions {
  category: string
  sortBy: string
  timeRange: string
  contentType: string
}

export function FeedTabs() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"for-you" | "trending" | "following" | "recent">("for-you")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedStats, setFeedStats] = useState<FeedStats>({
    forYou: 0,
    trending: 0,
    following: 0,
    recent: 0,
  })
  const [systemStatus, setSystemStatus] = useState({
    ai: "active",
    blockchain: "active",
    rpa: "active",
  })
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    sortBy: "latest",
    timeRange: "all",
    contentType: "all",
  })

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "spiritual", label: "Spiritual" },
    { value: "philosophy", label: "Philosophy" },
    { value: "community", label: "Community" },
    { value: "culture", label: "Culture" },
    { value: "wellness", label: "Wellness" },
    { value: "education", label: "Education" },
  ]

  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "popular", label: "Most Popular" },
    { value: "trending", label: "Trending" },
    { value: "discussed", label: "Most Discussed" },
  ]

  const timeRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  const contentTypes = [
    { value: "all", label: "All Content" },
    { value: "text", label: "Text Posts" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
  ]

  // Fetch feed statistics
  useEffect(() => {
    const fetchFeedStats = async () => {
      try {
        const response = await fetch("/api/feed/stats")
        if (response.ok) {
          const stats = await response.json()
          setFeedStats(stats)
        }
      } catch (error) {
        console.error("Failed to fetch feed stats:", error)
      }
    }

    fetchFeedStats()
    const interval = setInterval(fetchFeedStats, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Check system status
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch("/api/platform/stats")
        if (response.ok) {
          const data = await response.json()
          setSystemStatus(data.systemStatus || systemStatus)
        }
      } catch (error) {
        console.error("Failed to check system status:", error)
      }
    }

    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    monitoring.logUserAction("feed_tab_changed", { tab }, user?.id)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    monitoring.logUserAction("feed_search", { query }, user?.id)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    monitoring.logUserAction("feed_filter_changed", { key, value }, user?.id)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh feed stats
      const response = await fetch("/api/feed/stats")
      if (response.ok) {
        const stats = await response.json()
        setFeedStats(stats)
      }

      toast({
        title: "Feed refreshed",
        description: "Latest content has been loaded",
      })

      monitoring.logUserAction("feed_refreshed", { tab: activeTab }, user?.id)
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh feed",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "for-you":
        return <Sparkles className="h-4 w-4" />
      case "trending":
        return <TrendingUp className="h-4 w-4" />
      case "following":
        return <Users className="h-4 w-4" />
      case "recent":
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTabCount = (tab: string) => {
    switch (tab) {
      case "for-you":
        return feedStats.forYou
      case "trending":
        return feedStats.trending
      case "following":
        return feedStats.following
      case "recent":
        return feedStats.recent
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                संवाहा - Samvaaha Feed
              </h2>
              <p className="text-sm text-gray-600">AI-Enhanced Social Experience</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <Badge variant={systemStatus.ai === "active" ? "default" : "secondary"}>AI {systemStatus.ai}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <Badge variant={systemStatus.blockchain === "active" ? "default" : "secondary"}>
                  Blockchain {systemStatus.blockchain}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <Badge variant={systemStatus.rpa === "active" ? "default" : "secondary"}>RPA {systemStatus.rpa}</Badge>
              </div>
              <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts, topics, or users..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time Range</label>
                <Select value={filters.timeRange} onValueChange={(value) => handleFilterChange("timeRange", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Content Type</label>
                <Select value={filters.contentType} onValueChange={(value) => handleFilterChange("contentType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feed Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "for-you", label: "For You", description: "AI curated content" },
          { key: "trending", label: "Trending", description: "Popular right now" },
          { key: "following", label: "Following", description: "From people you follow" },
          { key: "recent", label: "Recent", description: "Latest posts" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => handleTabChange(tab.key as typeof activeTab)}
            className="flex items-center gap-2"
          >
            {getTabIcon(tab.key)}
            {tab.label}
            <Badge variant="secondary" className="ml-1">
              {getTabCount(tab.key)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Feed Content */}
      <InfiniteFeed
        tab={activeTab}
        filters={filters}
        searchQuery={searchQuery}
        onCommentClick={(postId) => {
          // Navigate to post detail or open comment modal
          window.location.href = `/samvaaha/post/${postId}`
        }}
      />
    </div>
  )
}
