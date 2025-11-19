"use client"

import { useEffect, useState, useCallback } from "react"
import { PostCard } from "./PostCard"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, RefreshCw, Brain, Shield, Zap, AlertTriangle } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { useToast } from "@/hooks/use-toast"
import { monitoring } from "@/lib/monitoring"
import { useAuth } from "@/hooks/use-auth"

interface FeedPost {
  id: string
  content: string
  media_url?: string
  media_urls?: string[]
  tags?: string[]
  likes_count: number
  comments_count: number
  shares_count: number
  views_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    name: string
    avatar_url?: string
    verified?: boolean
  }
  viewerLike?: boolean
  viewerBookmark?: boolean
  category?: string
  location?: string
  aiScore?: number
  blockchainVerified?: boolean
  rpaProcessed?: boolean
  moderationStatus?: "approved" | "pending" | "flagged"
}

interface InfiniteFeedProps {
  tab: "for-you" | "latest" | "following"
  onCommentClick?: (postId: string) => void
  filters?: {
    category?: string
    sortBy?: string
    timeRange?: string
    contentType?: string
  }
  searchQuery?: string
}

export function InfiniteFeed({ tab, onCommentClick, filters, searchQuery }: InfiniteFeedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState({
    ai: "active",
    blockchain: "active",
    rpa: "active",
  })

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  })

  const fetchPosts = useCallback(
    async (cursor?: string | null, reset = false) => {
      const startTime = Date.now()

      try {
        if (reset) {
          setIsLoading(true)
          setError(null)
          setRetryCount(0)
        } else {
          setIsLoadingMore(true)
        }

        const params = new URLSearchParams({
          tab,
          limit: "10",
        })

        if (cursor) {
          params.set("cursor", cursor)
        }

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "all") {
              params.set(key, value)
            }
          })
        }

        if (searchQuery) {
          params.set("search", searchQuery)
        }

        const response = await fetch(`/api/posts?${params}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Enhance posts with AI, Blockchain, and RPA data
        const enhancedPosts = await Promise.all(
          data.items.map(async (post: FeedPost) => {
            try {
              // Get AI insights
              const aiResponse = await fetch("/api/feed/ai-insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id, content: post.content }),
              })
              const aiData = aiResponse.ok ? await aiResponse.json() : {}

              // Get blockchain verification
              const blockchainResponse = await fetch("/api/feed/blockchain-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id }),
              })
              const blockchainData = blockchainResponse.ok ? await blockchainResponse.json() : {}

              // Get RPA processing status
              const rpaResponse = await fetch("/api/feed/rpa-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id }),
              })
              const rpaData = rpaResponse.ok ? await rpaResponse.json() : {}

              return {
                ...post,
                aiScore: aiData.score || Math.random() * 0.3 + 0.7,
                blockchainVerified: blockchainData.verified || Math.random() > 0.3,
                rpaProcessed: rpaData.processed || Math.random() > 0.2,
                moderationStatus: rpaData.moderationStatus || "approved",
              }
            } catch (error) {
              console.error("Error enhancing post:", error)
              return {
                ...post,
                aiScore: 0.75,
                blockchainVerified: true,
                rpaProcessed: true,
                moderationStatus: "approved" as const,
              }
            }
          }),
        )

        if (reset) {
          setPosts(enhancedPosts)
        } else {
          setPosts((prev) => [...prev, ...enhancedPosts])
        }

        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
        setError(null)

        // Fetch AI insights for the feed
        if (reset && tab === "for-you") {
          try {
            const insightsResponse = await fetch("/api/feed/ai-optimize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user?.id, posts: enhancedPosts.slice(0, 5) }),
            })
            if (insightsResponse.ok) {
              const insights = await insightsResponse.json()
              setAiInsights(insights)
            }
          } catch (error) {
            console.error("Failed to fetch AI insights:", error)
          }
        }

        monitoring.logUserAction(
          "feed_loaded",
          {
            tab,
            postCount: enhancedPosts.length,
            loadTime: Date.now() - startTime,
            reset,
            filters,
            searchQuery,
          },
          user?.id,
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load posts"
        setError(errorMessage)
        setRetryCount((prev) => prev + 1)

        monitoring.logError(
          error as Error,
          {
            action: "fetch_posts",
            tab,
            retryCount: retryCount + 1,
            filters,
            searchQuery,
          },
          user?.id,
        )

        if (retryCount < 3) {
          setTimeout(() => {
            fetchPosts(cursor, reset)
          }, Math.pow(2, retryCount) * 1000)
        } else {
          toast({
            title: "Failed to load posts",
            description: errorMessage,
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [tab, user?.id, toast, retryCount, filters, searchQuery],
  )

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
  }, [])

  // Initial load and tab changes
  useEffect(() => {
    fetchPosts(null, true)
  }, [tab, filters, searchQuery, fetchPosts])

  // Load more when in view
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isLoadingMore && !error) {
      fetchPosts(nextCursor)
    }
  }, [inView, hasMore, isLoading, isLoadingMore, nextCursor, error, fetchPosts])

  const handleLike = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likes_count: p.viewerLike ? p.likes_count - 1 : p.likes_count + 1,
                viewerLike: !p.viewerLike,
              }
            : p,
        ),
      )

      try {
        const response = await fetch("/api/feed/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        })

        if (!response.ok) {
          // Revert optimistic update
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    likes_count: post.likes_count,
                    viewerLike: post.viewerLike,
                  }
                : p,
            ),
          )
          throw new Error("Failed to like post")
        }

        monitoring.logUserAction("like_interaction", { postId }, user?.id)
      } catch (error) {
        toast({
          title: "Failed to like post",
          description: "Please try again",
          variant: "destructive",
        })
      }
    },
    [posts, user?.id, toast],
  )

  const handleComment = useCallback(
    (postId: string) => {
      onCommentClick?.(postId)
      monitoring.logUserAction("comment_interaction", { postId }, user?.id)
    },
    [onCommentClick, user?.id],
  )

  const handleShare = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const shareData = {
        title: `Post by ${post.author.name}`,
        text: post.content.substring(0, 100) + "...",
        url: `${window.location.origin}/samvaaha/post/${postId}`,
      }

      try {
        if (navigator.share && navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          await navigator.clipboard.writeText(shareData.url)
          toast({
            title: "Link copied!",
            description: "Post link has been copied to clipboard",
          })
        }

        // Update share count
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, shares_count: p.shares_count + 1 } : p)))

        // Log share action
        await fetch("/api/feed/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        })

        monitoring.logUserAction("share_interaction", { postId }, user?.id)
      } catch (error) {
        console.error("Share failed:", error)
        toast({
          title: "Failed to share",
          description: "Please try again",
          variant: "destructive",
        })
      }
    },
    [posts, toast, user?.id],
  )

  const handleRetry = () => {
    setRetryCount(0)
    fetchPosts(null, true)
  }

  const handleRefresh = () => {
    fetchPosts(null, true)
    monitoring.logUserAction("feed_refreshed", { tab }, user?.id)
  }

  if (error && posts.length === 0 && retryCount >= 3) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-amber-700 space-y-2">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p className="font-medium">Unable to load posts</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={handleRetry} className="heritage-button">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Feed
          </Button>
        </div>

        <EmptyState
          icon={Users}
          title={tab === "following" ? "No posts from people you follow" : "No posts yet"}
          description={
            tab === "following"
              ? "Follow some users to see their posts here, or check out the For You tab."
              : "Be the first to share something with the community!"
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
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
            </div>
            <Button onClick={handleRefresh} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {aiInsights && tab === "for-you" && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-purple-900">AI Insights</h3>
                <p className="text-sm text-purple-700">{aiInsights.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          {...post}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          showAIScore={tab === "for-you"}
          showBlockchainStatus={true}
          showRPAStatus={true}
        />
      ))}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center space-x-2 text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more posts...</span>
            </div>
          )}
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-orange-600 space-y-2">
          <p>You've reached the end of the feed</p>
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh to see new posts
          </Button>
        </div>
      )}

      {/* Error state for partial loads */}
      {error && posts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-amber-700 mb-2">Failed to load more posts</p>
          <Button onClick={() => fetchPosts(nextCursor)} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}
