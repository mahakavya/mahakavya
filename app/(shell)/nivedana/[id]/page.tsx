"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { DonationModal } from "@/components/fundraising/DonationModal"
import { ProgressStat } from "@/components/fundraising/ProgressStat"
import { DonationList } from "@/components/fundraising/DonationList"
import { CampaignUpdates } from "@/components/fundraising/CampaignUpdates"
import { AIInsightsPanel } from "@/components/fundraising/AIInsightsPanel"
import { BlockchainVerificationPanel } from "@/components/fundraising/BlockchainVerificationPanel"
import { RPAStatusPanel } from "@/components/fundraising/RPAStatusPanel"
import { SocialSharePanel } from "@/components/fundraising/SocialSharePanel"
import { CampaignAnalytics } from "@/components/fundraising/CampaignAnalytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useCampaignRealtime } from "@/lib/fundraising-realtime"
import { linkifyText } from "@/lib/linkify"
import { formatINR } from "@/lib/money"
import { formatDistanceToNow } from "date-fns"
import { Heart, Share2, Calendar, MapPin, Users, TrendingUp, Shield, Bot, Eye, Flag, Edit } from "lucide-react"

interface Campaign {
  id: string
  title: string
  description: string
  cover_url?: string
  goal_amount: number
  raised_amount: number
  status: string
  created_at: string
  updated_at: string
  category?: string
  location?: string
  tags?: string[]
  ai_score?: number
  blockchain_verified?: boolean
  rpa_optimized?: boolean
  trending_score?: number
  visibility_score?: number
  engagement_rate?: number
  owner: {
    id: string
    name: string
    avatar_url?: string
    bio?: string
    verified?: boolean
  }
  stats?: {
    views: number
    shares: number
    comments: number
    supporters: number
  }
  summary?: string
  donation_recommendations?: string[]
}

interface CampaignInsights {
  successProbability: number
  recommendedActions: string[]
  performanceMetrics: {
    engagementRate: number
    conversionRate: number
    shareRate: number
  }
  aiOptimizations: {
    titleSuggestions: string[]
    contentImprovements: string[]
    targetAudience: string[]
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [insights, setInsights] = useState<CampaignInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [optimisticRaised, setOptimisticRaised] = useState(0)
  const [isOwner, setIsOwner] = useState(false)
  const [viewTracked, setViewTracked] = useState(false)
  const { toast } = useToast()

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/nivedana")
            return
          }
          throw new Error("Failed to load campaign")
        }
        const data = await response.json()
        setCampaign(data)
        setOptimisticRaised(data.raised_amount)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load campaign details.",
          variant: "destructive",
        })
        router.push("/nivedana")
      } finally {
        setIsLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaign()
    }
  }, [campaignId, router, toast])

  // Check user access and ownership
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const [accessResponse, userResponse] = await Promise.all([fetch("/api/me/access"), fetch("/api/me")])

        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          setHasAccess(accessData.hasIntroAccess || accessData.hasActiveSubscription)
        }

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCurrentUserId(userData.id)
          setIsOwner(campaign?.owner.id === userData.id)
        }
      } catch (error) {
        console.error("Failed to check user status:", error)
      }
    }

    checkUserStatus()
  }, [campaign?.owner.id])

  // Track page view
  useEffect(() => {
    const trackView = async () => {
      if (!viewTracked && campaignId) {
        try {
          await fetch(`/api/fundraising/campaigns/${campaignId}/view`, {
            method: "POST",
          })
          setViewTracked(true)
        } catch (error) {
          console.error("Failed to track view:", error)
        }
      }
    }

    trackView()
  }, [campaignId, viewTracked])

  // Fetch AI insights
  useEffect(() => {
    const fetchInsights = async () => {
      if (!campaign) return

      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/insights`)
        if (response.ok) {
          const data = await response.json()
          setInsights(data)
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error)
      }
    }

    fetchInsights()
  }, [campaign, campaignId])

  // Handle real-time donations
  const handleNewDonation = (amount: number) => {
    setOptimisticRaised((prev) => prev + amount)
    toast({
      title: "New donation received!",
      description: `Someone just donated ${formatINR(amount)} to this campaign.`,
    })
  }

  useCampaignRealtime(campaignId, {
    onDonation: handleNewDonation,
  })

  const handleShare = async () => {
    const url = window.location.href
    const text = `Check out this fundraising campaign: ${campaign?.title}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign?.title,
          text,
          url,
        })

        // Track share
        await fetch(`/api/fundraising/campaigns/${campaignId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "native" }),
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast({
          title: "Link copied!",
          description: "Campaign link copied to clipboard.",
        })

        // Track share
        await fetch(`/api/fundraising/campaigns/${campaignId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: "clipboard" }),
        })
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to copy link to clipboard.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDonationSuccess = (amount: number) => {
    setOptimisticRaised((prev) => prev + amount)
  }

  const handleReport = async () => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "campaign",
          entityId: campaignId,
          reason: "inappropriate_content",
        }),
      })

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Thank you for reporting this campaign. We'll review it shortly.",
        })
      }
    } catch (error) {
      toast({
        title: "Report failed",
        description: "Unable to submit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-gray-200 rounded-2xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
        <p className="text-gray-600">The campaign you're looking for doesn't exist or is no longer available.</p>
        <Button onClick={() => router.push("/nivedana")} className="mt-4">
          Browse Campaigns
        </Button>
      </div>
    )
  }

  const progressPercentage = Math.min((optimisticRaised / campaign.goal_amount) * 100, 100)

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.title}
        subtitle={
          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={campaign.owner.avatar_url || "/placeholder.svg"} alt={campaign.owner.name} />
                <AvatarFallback className="text-xs">{campaign.owner.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>by {campaign.owner.name}</span>
              {campaign.owner.verified && <Shield className="h-4 w-4 text-blue-500" />}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
            </div>
            {campaign.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{campaign.location}</span>
              </div>
            )}
            {campaign.category && <Badge variant="secondary">{campaign.category}</Badge>}
            {campaign.status !== "live" && <Badge variant="outline">{campaign.status}</Badge>}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/nivedana/${campaignId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {!isOwner && (
              <Button variant="outline" size="sm" onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            )}
          </div>
        }
      />

      {/* Campaign Stats Bar */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{campaign.stats?.views || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Eye className="h-4 w-4" />
                Views
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{campaign.stats?.supporters || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Supporters
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{campaign.stats?.shares || 0}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Share2 className="h-4 w-4" />
                Shares
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{progressPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Funded
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          {campaign.cover_url && (
            <div className="aspect-video relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-md border border-white/40">
              <Image
                src={campaign.cover_url || "/placeholder.svg"}
                alt={campaign.title}
                fill
                className="object-cover"
                priority
              />
              {/* Technology Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                {campaign.ai_score && campaign.ai_score > 0.7 && (
                  <Badge className="bg-blue-500/80 backdrop-blur-sm">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Enhanced
                  </Badge>
                )}
                {campaign.blockchain_verified && (
                  <Badge className="bg-green-500/80 backdrop-blur-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {campaign.rpa_optimized && (
                  <Badge className="bg-purple-500/80 backdrop-blur-sm">
                    <Bot className="h-3 w-3 mr-1" />
                    Auto-Optimized
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Campaign Content Tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">About This Campaign</h2>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: linkifyText(campaign.description.replace(/\n/g, "<br>")),
                    }}
                  />

                  {/* Tags */}
                  {campaign.tags && campaign.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {campaign.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaign Summary */}
                  {campaign.summary && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Campaign Summary</h3>
                      <p className="text-gray-600 mt-1">{campaign.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Owner Information */}
              <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Campaign Organizer</h3>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={campaign.owner.avatar_url || "/placeholder.svg"} alt={campaign.owner.name} />
                      <AvatarFallback>{campaign.owner.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{campaign.owner.name}</h4>
                        {campaign.owner.verified && <Shield className="h-4 w-4 text-blue-500" />}
                      </div>
                      {campaign.owner.bio && <p className="text-sm text-gray-600 mt-1">{campaign.owner.bio}</p>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 bg-transparent"
                        onClick={() => router.push(`/parichaya/${campaign.owner.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="updates">
              <CampaignUpdates campaignId={campaignId} isOwner={isOwner} />
            </TabsContent>

            <TabsContent value="insights">{insights && <AIInsightsPanel insights={insights} />}</TabsContent>

            <TabsContent value="analytics">{isOwner && <CampaignAnalytics campaignId={campaignId} />}</TabsContent>
          </Tabs>

          {/* Mobile Progress (hidden on desktop) */}
          <Card className="lg:hidden bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
            <CardContent className="p-6">
              <ProgressStat raised={optimisticRaised} goal={campaign.goal_amount} />
              <div className="mt-6 space-y-3">
                <Button onClick={() => setShowDonationModal(true)} className="w-full" size="lg">
                  <Heart className="h-4 w-4 mr-2" />
                  Support This Campaign
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card (desktop only) */}
          <Card className="hidden lg:block bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl sticky top-6">
            <CardContent className="p-6">
              <ProgressStat raised={optimisticRaised} goal={campaign.goal_amount} />

              <div className="mt-6 space-y-3">
                <Button onClick={() => setShowDonationModal(true)} className="w-full" size="lg">
                  <Heart className="h-4 w-4 mr-2" />
                  Support This Campaign
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Campaign
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Goal Amount</span>
                  <span className="font-medium">{formatINR(campaign.goal_amount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Amount Raised</span>
                  <span className="font-medium text-green-600">{formatINR(optimisticRaised)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className="font-medium">{formatINR(Math.max(0, campaign.goal_amount - optimisticRaised))}</span>
                </div>
                {campaign.engagement_rate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Engagement Rate</span>
                    <span className="font-medium">{(campaign.engagement_rate * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Technology Status Panels */}
          <div className="space-y-4">
            <BlockchainVerificationPanel campaignId={campaignId} verified={campaign.blockchain_verified || false} />
            <RPAStatusPanel campaignId={campaignId} optimized={campaign.rpa_optimized || false} />
          </div>

          {/* Social Share Panel */}
          <SocialSharePanel campaignId={campaignId} title={campaign.title} description={campaign.description} />

          {/* Recent Donations */}
          <DonationList campaignId={campaignId} showReceipts={true} currentUserId={currentUserId} />

          {/* Donation Recommendations */}
          {campaign.donation_recommendations && (
            <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Donation Recommendations</h3>
                <ul className="space-y-4 text-sm">
                  {campaign.donation_recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* FAQ */}
          <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Donation FAQ</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Is my donation secure?</h4>
                  <p className="text-gray-600 mt-1">
                    Yes, all payments are processed securely through Razorpay with industry-standard encryption.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Can I get a refund?</h4>
                  <p className="text-gray-600 mt-1">
                    Donations are generally non-refundable. Please contact support if you have concerns.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">How do I track the campaign?</h4>
                  <p className="text-gray-600 mt-1">
                    Campaign progress is updated in real-time. You can bookmark this page to check updates.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Is this campaign verified?</h4>
                  <p className="text-gray-600 mt-1">
                    {campaign.blockchain_verified
                      ? "Yes, this campaign is blockchain-verified for authenticity."
                      : "This campaign is pending blockchain verification."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Donation Modal */}
      <DonationModal
        campaignId={campaignId}
        open={showDonationModal}
        onOpenChange={setShowDonationModal}
        hasAccess={hasAccess}
        onDonationSuccess={handleDonationSuccess}
      />
    </div>
  )
}
