"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { CampaignCard } from "@/components/fundraising/CampaignCard"
import { CampaignWizard } from "@/components/fundraising/CampaignWizard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, TrendingUp, Heart, Users, Target, Sparkles, Shield, Zap } from "lucide-react"
import useSWRInfinite from "swr/infinite"

interface Campaign {
  id: string
  title: string
  cover_url?: string
  goal_amount: number
  raised_amount: number
  owner: {
    name: string
    avatar_url?: string
  }
  created_at: string
  status?: string
  ai_score?: number
  blockchain_verified?: boolean
  rpa_optimized?: boolean
  trending_score?: number
}

interface AIInsights {
  totalCampaigns: number
  successRate: number
  avgDonation: number
  trendingCategories: string[]
  recommendations: string[]
}

interface BlockchainStats {
  verifiedCampaigns: number
  totalTransactions: number
  securityScore: number
}

interface RPAMetrics {
  optimizedCampaigns: number
  automationSavings: number
  processEfficiency: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NivedanaPage() {
  const [showWizard, setShowWizard] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "mine" | "trending" | "verified">("all")
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null)
  const [rpaMetrics, setRpaMetrics] = useState<RPAMetrics | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(true)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/me/access")
        if (response.ok) {
          const data = await response.json()
          setHasActiveSubscription(data.hasActiveSubscription)
        }
      } catch (error) {
        console.error("Failed to check subscription:", error)
      }
    }

    checkSubscription()
  }, [])

  // Load AI insights, blockchain stats, and RPA metrics
  useEffect(() => {
    const loadInsights = async () => {
      try {
        const [aiResponse, blockchainResponse, rpaResponse] = await Promise.all([
          fetch("/api/fundraising/ai-insights"),
          fetch("/api/fundraising/blockchain-stats"),
          fetch("/api/fundraising/rpa-metrics"),
        ])

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          setAiInsights(aiData)
        }

        if (blockchainResponse.ok) {
          const blockchainData = await blockchainResponse.json()
          setBlockchainStats(blockchainData)
        }

        if (rpaResponse.ok) {
          const rpaData = await rpaResponse.json()
          setRpaMetrics(rpaData)
        }
      } catch (error) {
        console.error("Failed to load insights:", error)
      } finally {
        setIsLoadingInsights(false)
      }
    }

    loadInsights()
  }, [])

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextCursor) return null

    const params = new URLSearchParams()
    if (filter === "mine") params.set("status", "mine")
    if (filter === "trending") params.set("trending", "true")
    if (filter === "verified") params.set("verified", "true")
    if (search) params.set("search", search)
    if (pageIndex > 0 && previousPageData?.nextCursor) {
      params.set("cursor", previousPageData.nextCursor)
    }

    return `/api/fundraising/campaigns?${params.toString()}`
  }

  const { data, error, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  })

  const campaigns = data ? data.flatMap((page) => page.items) : []
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")
  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.nextCursor === null)

  const handleLoadMore = () => {
    setSize(size + 1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    mutate()
  }

  const handleFilterChange = (newFilter: "all" | "mine" | "trending" | "verified") => {
    setFilter(newFilter)
    mutate()
  }

  const handleAIOptimize = async () => {
    try {
      const response = await fetch("/api/fundraising/ai-optimize", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "AI Optimization Complete",
          description: "Campaign recommendations have been updated with AI insights.",
        })
        mutate()
      }
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize campaigns. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBlockchainVerify = async () => {
    try {
      const response = await fetch("/api/fundraising/blockchain-verify-all", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Blockchain Verification Started",
          description: "All campaigns are being verified on the blockchain.",
        })
        mutate()
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to start blockchain verification. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRPAOptimize = async () => {
    try {
      const response = await fetch("/api/fundraising/rpa-optimize", {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "RPA Optimization Started",
          description: "Campaign processes are being automated and optimized.",
        })
        mutate()
      }
    } catch (error) {
      toast({
        title: "RPA Optimization Failed",
        description: "Unable to start RPA optimization. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nivedana — Fundraising" subtitle="Support meaningful community projects and causes" />

      {/* AI Insights, Blockchain Stats, and RPA Metrics */}
      {!isLoadingInsights && (aiInsights || blockchainStats || rpaMetrics) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Sparkles className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Success Rate</span>
                  <span className="font-semibold text-blue-800">{aiInsights.successRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Avg Donation</span>
                  <span className="font-semibold text-blue-800">₹{aiInsights.avgDonation}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIOptimize}
                  className="w-full mt-2 border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Optimize
                </Button>
              </CardContent>
            </Card>
          )}

          {blockchainStats && (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Shield className="h-5 w-5" />
                  Blockchain Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Verified Campaigns</span>
                  <span className="font-semibold text-green-800">{blockchainStats.verifiedCampaigns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Security Score</span>
                  <span className="font-semibold text-green-800">{blockchainStats.securityScore}%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBlockchainVerify}
                  className="w-full mt-2 border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Verify All
                </Button>
              </CardContent>
            </Card>
          )}

          {rpaMetrics && (
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Zap className="h-5 w-5" />
                  RPA Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Optimized</span>
                  <span className="font-semibold text-purple-800">{rpaMetrics.optimizedCampaigns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Efficiency</span>
                  <span className="font-semibold text-purple-800">{rpaMetrics.processEfficiency}%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRPAOptimize}
                  className="w-full mt-2 border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  RPA Optimize
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterChange("all")}
          >
            <Heart className="h-3 w-3 mr-1" />
            All Campaigns
          </Badge>
          <Badge
            variant={filter === "trending" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterChange("trending")}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </Badge>
          <Badge
            variant={filter === "verified" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterChange("verified")}
          >
            <Shield className="h-3 w-3 mr-1" />
            Verified
          </Badge>
          <Badge
            variant={filter === "mine" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterChange("mine")}
          >
            <Users className="h-3 w-3 mr-1" />
            My Campaigns
          </Badge>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Start Campaign
          </Button>
        </div>
      </div>

      {/* AI Recommendations */}
      {aiInsights?.recommendations && aiInsights.recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Sparkles className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-orange-100">
                  <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-orange-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          title={filter === "mine" ? "No campaigns created" : "No campaigns found"}
          description={
            filter === "mine"
              ? "You haven't created any fundraising campaigns yet."
              : search
                ? "Try adjusting your search terms or filters."
                : "Be the first to create a fundraising campaign."
          }
          action={
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Your First Campaign
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign: Campaign) => (
              <div key={campaign.id} className="relative">
                <CampaignCard
                  id={campaign.id}
                  title={campaign.title}
                  cover_url={campaign.cover_url}
                  goal_amount={campaign.goal_amount}
                  raised_amount={campaign.raised_amount}
                  owner={campaign.owner}
                  created_at={campaign.created_at}
                  status={campaign.status}
                />

                {/* AI/Blockchain/RPA Indicators */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {campaign.ai_score && campaign.ai_score > 0.8 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI
                    </Badge>
                  )}
                  {campaign.blockchain_verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {campaign.rpa_optimized && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      RPA
                    </Badge>
                  )}
                </div>

                {/* Trending Indicator */}
                {campaign.trending_score && campaign.trending_score > 0.7 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isReachingEnd && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Campaign Wizard */}
      <CampaignWizard open={showWizard} onOpenChange={setShowWizard} hasActiveSubscription={hasActiveSubscription} />
    </div>
  )
}
