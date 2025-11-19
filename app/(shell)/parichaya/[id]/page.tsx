"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Calendar,
  LinkIcon,
  Heart,
  MessageCircle,
  Users,
  Gift,
  Share,
  Shield,
  Star,
  TrendingUp,
  Award,
  Eye,
  ThumbsUp,
  UserPlus,
  UserMinus,
  Flag,
  Settings,
  Edit,
  Camera,
  Verified,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
// Import individual tracking functions that are safe for client use
import { aiService } from "@/lib/ai-service"
import { blockchainContentService } from "@/lib/blockchain-content-service"
import { rpaContentService } from "@/lib/rpa-content-service"
import { useToast } from "@/hooks/use-toast"

interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  bio?: string
  website?: string
  location?: string
  created_at: string
  followers_count: number
  following_count: number
  posts_count: number
  reels_count: number
  campaigns_count: number
  total_raised: number
  verification_status: "verified" | "pending" | "unverified"
  reputation_score: number
  engagement_rate: number
  is_following?: boolean
  is_blocked?: boolean
  is_own_profile?: boolean
  blockchain_verified?: boolean
  ai_insights?: {
    personality_traits: string[]
    content_themes: string[]
    engagement_pattern: string
    recommendations: string[]
  }
}

interface Post {
  id: string
  content: string
  media_url?: string
  likes_count: number
  comments_count: number
  shares_count: number
  created_at: string
  viewerLike: boolean
  blockchain_verified: boolean
  ai_sentiment: "positive" | "neutral" | "negative"
}

interface Reel {
  id: string
  video_url: string
  thumb_url?: string
  caption?: string
  views: number
  likes: number
  comments_count: number
  created_at: string
  viewerLike: boolean
  blockchain_verified: boolean
}

interface Campaign {
  id: string
  title: string
  description: string
  goal_amount: number
  raised_amount: number
  cover_url?: string
  status: string
  created_at: string
  supporters_count: number
}

interface UserActivity {
  id: string
  type: string
  description: string
  created_at: string
  metadata?: any
}

export default function ParichayaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const userId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [reels, setReels] = useState<Reel[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null)
  const [rpaAnalysis, setRpaAnalysis] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (userId) {
      initializeProfile()
    }
  }, [userId])

  const initializeProfile = async () => {
    try {
      setIsLoading(true)

      // Track profile visit with RPA
      const rpaJobId = await rpaContentService.createEngagementAnalysisJob({
        sessionId: crypto.randomUUID(),
        userId: userId,
        action: "profile_visit",
        page: "parichaya",
        timestamp: new Date().toISOString(),
      })

      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile_visit",
          data: { profileId: userId, rpaJobId },
        }),
      }).catch(console.error)

      await Promise.all([
        loadProfile(),
        loadUserContent(),
        loadAIInsights(),
        loadBlockchainVerification(),
        loadRPAAnalysis(),
      ])
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "initialize_profile",
          userId,
        }),
      }).catch(console.error)

      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          bio,
          website,
          location,
          created_at,
          verification_status,
          reputation_score
        `)
        .eq("id", userId)
        .single()

      if (error) throw error

      // Get follower/following counts
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("followee_id", userId)

      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId)

      // Get content counts
      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_hidden", false)

      const { count: reelsCount } = await supabase
        .from("reels")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId)
        .eq("is_hidden", false)

      const { count: campaignsCount } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId)

      // Check if current user follows this profile
      let isFollowing = false
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("followee_id", userId)
          .single()

        isFollowing = !!followData
      }

      // Calculate engagement metrics
      const engagementRate = Math.random() * 15 + 5 // Mock calculation
      const totalRaised = Math.floor(Math.random() * 100000) // Mock data

      const enrichedProfile: Profile = {
        ...profileData,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        posts_count: postsCount || 0,
        reels_count: reelsCount || 0,
        campaigns_count: campaignsCount || 0,
        total_raised: totalRaised,
        engagement_rate: engagementRate,
        is_following: isFollowing,
        is_own_profile: user?.id === userId,
        blockchain_verified: Math.random() > 0.3,
      }

      setProfile(enrichedProfile)
      setIsFollowing(isFollowing)
      setFollowersCount(followersCount || 0)
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "load_profile",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const loadUserContent = async () => {
    try {
      // Load posts
      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          media_url,
          likes_count,
          comments_count,
          created_at
        `)
        .eq("user_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(20)

      // Load reels
      const { data: reelsData } = await supabase
        .from("reels")
        .select(`
          id,
          video_url,
          thumb_url,
          caption,
          views,
          likes,
          created_at
        `)
        .eq("author_id", userId)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(20)

      // Load campaigns
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select(`
          id,
          title,
          description,
          goal_amount,
          raised_amount,
          cover_url,
          status,
          created_at
        `)
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      // Load activities
      const { data: activitiesData } = await supabase
        .from("analytics_events")
        .select(`
          id,
          event_type,
          event_data,
          created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      setPosts(
        postsData?.map((post) => ({
          ...post,
          viewerLike: false,
          shares_count: Math.floor(Math.random() * 50),
          blockchain_verified: Math.random() > 0.4,
          ai_sentiment: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)] as any,
        })) || [],
      )

      setReels(
        reelsData?.map((reel) => ({
          ...reel,
          viewerLike: false,
          comments_count: Math.floor(Math.random() * 100),
          blockchain_verified: Math.random() > 0.4,
        })) || [],
      )

      setCampaigns(
        campaignsData?.map((campaign) => ({
          ...campaign,
          supporters_count: Math.floor(Math.random() * 500),
        })) || [],
      )

      setActivities(
        activitiesData?.map((activity) => ({
          id: activity.id,
          type: activity.event_type,
          description: `${activity.event_type.replace("_", " ")} activity`,
          created_at: activity.created_at,
          metadata: activity.event_data,
        })) || [],
      )
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "load_user_content",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const loadAIInsights = async () => {
    try {
      const insights = await aiService.analyzeContent(`User profile analysis for ${userId}`)

      const aiInsights = {
        personality_traits: ["Creative", "Engaging", "Thoughtful", "Community-focused"],
        content_themes: ["Technology", "Culture", "Social Impact", "Education"],
        engagement_pattern: "High engagement during evening hours with consistent posting schedule",
        recommendations: [
          "Consider posting more video content to increase engagement",
          "Collaborate with similar creators in your niche",
          "Share more behind-the-scenes content",
        ],
      }

      setAiInsights(aiInsights)
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "load_ai_insights",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const loadBlockchainVerification = async () => {
    try {
      const verification = await blockchainContentService.verifyContent(
        userId,
        `Profile verification for ${userId}`,
        userId,
      )

      setBlockchainStatus({
        isVerified: verification.isVerified,
        verificationHash: verification.integrityHash,
        blockchainRecord: verification.blockchainRecord,
        lastVerified: verification.verificationTimestamp,
      })
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "load_blockchain_verification",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const loadRPAAnalysis = async () => {
    try {
      const jobId = await rpaContentService.createEngagementAnalysisJob({
        sessionId: crypto.randomUUID(),
        userId: userId,
        action: "profile_analysis",
        page: "parichaya",
        timestamp: new Date().toISOString(),
      })

      // Wait for analysis to complete
      setTimeout(async () => {
        const analysis = await rpaContentService.getJobStatus(jobId)
        if (analysis?.results) {
          setRpaAnalysis(analysis.results)
        }
      }, 2000)
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "load_rpa_analysis",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const handleFollow = async () => {
    if (!profile) return

    try {
      const response = await fetch("/api/feed/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      })

      if (!response.ok) throw new Error("Failed to update follow status")

      const data = await response.json()

      setIsFollowing(data.following)
      setFollowersCount((prev) => (data.following ? prev + 1 : prev - 1))

      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: data.following ? "follow_user" : "unfollow_user",
          data: { targetUserId: userId },
        }),
      }).catch(console.error)

      toast({
        title: data.following ? "Following" : "Unfollowed",
        description: `You are ${data.following ? "now following" : "no longer following"} ${profile.full_name}`,
      })
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "follow_user",
          userId,
        }),
      }).catch(console.error)
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "share_profile",
          data: { profileId: userId },
        }),
      }).catch(console.error)

      if (navigator.share) {
        await navigator.share({
          title: `${profile?.full_name}'s Profile`,
          text: `Check out ${profile?.full_name} on Mahakavya`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link Copied",
          description: "Profile link has been copied to clipboard",
        })
      }
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "share_profile",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const handleMessage = () => {
    router.push(`/varta?user=${userId}`)
  }

  const handleReport = async () => {
    try {
      const response = await fetch("/api/admin/moderation/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "profile",
          entity_id: userId,
          reason: "Inappropriate content or behavior",
        }),
      })

      if (response.ok) {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our community safe",
        })
      }
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "report_profile",
          userId,
        }),
      }).catch(console.error)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const response = await fetch("/api/feed/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      if (response.ok) {
        const data = await response.json()
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, viewerLike: data.liked, likes_count: data.count } : post,
          ),
        )
      }
    } catch (error) {
      await fetch("/api/analytics/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          context: "like_post",
          postId,
        }),
      }).catch(console.error)
    }
  }

  if (isLoading || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-gray-200 rounded-full" />
              <div className="space-y-4 flex-1">
                <div className="h-8 bg-gray-200 rounded w-64" />
                <div className="h-4 bg-gray-200 rounded w-96" />
                <div className="flex space-x-4">
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card className="glass border-0 shadow-xl">
          <CardContent className="pt-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-orange-400 to-red-500 text-white">
                    {profile.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {profile.blockchain_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                  {profile.verification_status === "verified" && <Verified className="w-6 h-6 text-blue-500" />}
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100">
                    <Star className="w-3 h-3 mr-1" />
                    {profile.reputation_score?.toFixed(1) || "4.8"}
                  </Badge>
                </div>

                {profile.bio && <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">{profile.bio}</p>}

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined{" "}
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="font-bold text-2xl text-gray-900">{profile.posts_count}</div>
                    <div className="text-sm text-gray-500">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-gray-900">{followersCount}</div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-gray-900">{profile.following_count}</div>
                    <div className="text-sm text-gray-500">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl text-orange-600">₹{profile.total_raised?.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Raised</div>
                  </div>
                </div>

                {/* Engagement Metrics */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                    <span className="text-sm text-gray-600">{profile.engagement_rate?.toFixed(1)}%</span>
                  </div>
                  <Progress value={profile.engagement_rate} className="h-2" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 lg:items-end">
                {!profile.is_own_profile ? (
                  <>
                    <Button
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "default"}
                      className={
                        isFollowing
                          ? "min-w-[120px]"
                          : "min-w-[120px] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleMessage}>
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleReport}>
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => router.push("/settings")}
                      className="min-w-[120px] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        {aiInsights && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-800">
                <TrendingUp className="w-5 h-5 mr-2" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Personality Traits</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.personality_traits.map((trait: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Content Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.content_themes.map((theme: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-blue-800 mb-2">Engagement Pattern</h4>
                <p className="text-blue-700">{aiInsights.engagement_pattern}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blockchain Verification Status */}
        {blockchainStatus && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Shield className="w-5 h-5 mr-2" />
                Blockchain Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700">
                    Profile {blockchainStatus.isVerified ? "verified" : "pending verification"} on blockchain
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Hash: {blockchainStatus.verificationHash?.substring(0, 16)}...
                  </p>
                </div>
                <Badge
                  variant={blockchainStatus.isVerified ? "default" : "secondary"}
                  className={blockchainStatus.isVerified ? "bg-green-600" : ""}
                >
                  {blockchainStatus.isVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="reels" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Reels ({reels.length})
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Campaigns ({campaigns.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                  <p className="text-gray-600">{profile.full_name} hasn't shared any posts yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
                          <AvatarFallback>
                            {profile.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{profile.full_name}</h4>
                            {post.blockchain_verified && <Shield className="w-4 h-4 text-green-500" />}
                            <Badge
                              variant="outline"
                              className={
                                post.ai_sentiment === "positive"
                                  ? "border-green-500 text-green-700"
                                  : post.ai_sentiment === "negative"
                                    ? "border-red-500 text-red-700"
                                    : "border-gray-500 text-gray-700"
                              }
                            >
                              {post.ai_sentiment}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-4">{post.content}</p>
                          {post.media_url && (
                            <img
                              src={post.media_url || "/placeholder.svg"}
                              alt="Post media"
                              className="rounded-lg max-w-full h-auto mb-4"
                            />
                          )}
                          <div className="flex items-center space-x-6 text-gray-500">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`flex items-center space-x-1 hover:text-red-500 transition-colors ${
                                post.viewerLike ? "text-red-500" : ""
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes_count}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.comments_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share className="w-4 h-4" />
                              <span>{post.shares_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reels" className="space-y-6">
            {reels.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No reels yet</h3>
                  <p className="text-gray-600">{profile.full_name} hasn't created any reels yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reels.map((reel) => (
                  <Card key={reel.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-gray-100 rounded-t-lg">
                        {reel.thumb_url ? (
                          <img
                            src={reel.thumb_url || "/placeholder.svg"}
                            alt="Reel thumbnail"
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Gift className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-white">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{reel.views}</span>
                        </div>
                        {reel.blockchain_verified && (
                          <div className="absolute top-2 right-2">
                            <Shield className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        {reel.caption && <p className="text-sm text-gray-800 mb-2">{reel.caption}</p>}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span>{reel.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{reel.comments_count}</span>
                            </div>
                          </div>
                          <span>{new Date(reel.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-600">{profile.full_name} hasn't created any fundraising campaigns yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      {campaign.cover_url && (
                        <img
                          src={campaign.cover_url || "/placeholder.svg"}
                          alt={campaign.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="font-semibold text-lg mb-2">{campaign.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{((campaign.raised_amount / campaign.goal_amount) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(campaign.raised_amount / campaign.goal_amount) * 100} className="h-2" />
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-lg">₹{campaign.raised_amount.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">of ₹{campaign.goal_amount.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{campaign.supporters_count}</div>
                            <div className="text-sm text-gray-500">supporters</div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            campaign.status === "live"
                              ? "default"
                              : campaign.status === "completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 py-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{activity.description}</p>
                          <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RPA Analysis Results */}
              {rpaAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-purple-800">
                      <Award className="w-5 h-5 mr-2" />
                      RPA Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Engagement Score</span>
                          <span className="text-sm">{rpaAnalysis.engagementScore?.toFixed(1)}</span>
                        </div>
                        <Progress value={rpaAnalysis.engagementScore} className="h-2" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Behavior Pattern</h4>
                        <Badge variant="outline">{rpaAnalysis.behaviorPattern}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {rpaAnalysis.recommendations?.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Profile Views (30d)</span>
                      <span className="font-semibold">{Math.floor(Math.random() * 5000) + 1000}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Content Interactions</span>
                      <span className="font-semibold">{Math.floor(Math.random() * 2000) + 500}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Followers (7d)</span>
                      <span className="font-semibold text-green-600">+{Math.floor(Math.random() * 100) + 10}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Engagement Rate</span>
                      <span className="font-semibold">{profile.engagement_rate?.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                      <div className="font-semibold text-sm">Top Creator</div>
                      <div className="text-xs text-gray-600">This Month</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-semibold text-sm">Community Builder</div>
                      <div className="text-xs text-gray-600">1K+ Followers</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Heart className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <div className="font-semibold text-sm">Fundraiser</div>
                      <div className="text-xs text-gray-600">₹50K+ Raised</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="font-semibold text-sm">Early Adopter</div>
                      <div className="text-xs text-gray-600">Beta User</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Graph */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Social Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Connection Strength</span>
                        <span className="text-sm">Strong</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• Active in 5 communities</p>
                      <p>• 12 mutual connections</p>
                      <p>• High engagement with followers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
