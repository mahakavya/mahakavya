"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Hash, TrendingUp, Users, RefreshCw, ArrowUp, Flame, Star } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { monitoring } from "@/lib/monitoring"

interface TrendingTopic {
  id: string
  hashtag: string
  postCount: number
  engagementCount: number
  growthRate: number
  category: string
  isRising: boolean
}

interface CommunityStats {
  activeUsers: number
  postsToday: number
  discussions: number
  newMembers: number
}

interface SuggestedUser {
  id: string
  name: string
  bio: string
  avatar_url?: string
  followerCount: number
  isVerified: boolean
}

export function TrendingTopics() {
  const { user } = useAuth()
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    activeUsers: 0,
    postsToday: 0,
    discussions: 0,
    newMembers: 0,
  })
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch trending topics
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const response = await fetch("/api/feed/trending-topics")
        if (response.ok) {
          const data = await response.json()
          setTrendingTopics(data.topics || [])
        } else {
          // Fallback data
          setTrendingTopics([
            {
              id: "1",
              hashtag: "meditation",
              postCount: 156,
              engagementCount: 1240,
              growthRate: 23.5,
              category: "spiritual",
              isRising: true,
            },
            {
              id: "2",
              hashtag: "bhagavadgita",
              postCount: 89,
              engagementCount: 890,
              growthRate: 18.2,
              category: "philosophy",
              isRising: true,
            },
            {
              id: "3",
              hashtag: "seva",
              postCount: 67,
              engagementCount: 567,
              growthRate: 12.1,
              category: "community",
              isRising: false,
            },
            {
              id: "4",
              hashtag: "yoga",
              postCount: 134,
              engagementCount: 1100,
              growthRate: 8.7,
              category: "wellness",
              isRising: false,
            },
            {
              id: "5",
              hashtag: "sanskrit",
              postCount: 45,
              engagementCount: 380,
              growthRate: 15.3,
              category: "culture",
              isRising: true,
            },
          ])
        }
      } catch (error) {
        console.error("Failed to fetch trending topics:", error)
      }
    }

    fetchTrendingTopics()
    const interval = setInterval(fetchTrendingTopics, 300000) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Fetch community stats
  useEffect(() => {
    const fetchCommunityStats = async () => {
      try {
        const response = await fetch("/api/platform/stats")
        if (response.ok) {
          const data = await response.json()
          setCommunityStats(
            data.communityStats || {
              activeUsers: 2400,
              postsToday: 156,
              discussions: 89,
              newMembers: 23,
            },
          )
        } else {
          setCommunityStats({
            activeUsers: 2400,
            postsToday: 156,
            discussions: 89,
            newMembers: 23,
          })
        }
      } catch (error) {
        console.error("Failed to fetch community stats:", error)
        setCommunityStats({
          activeUsers: 2400,
          postsToday: 156,
          discussions: 89,
          newMembers: 23,
        })
      }
    }

    fetchCommunityStats()
    const interval = setInterval(fetchCommunityStats, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [])

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await fetch("/api/profiles/suggested")
        if (response.ok) {
          const data = await response.json()
          setSuggestedUsers(data.users || [])
        } else {
          // Fallback data
          setSuggestedUsers([
            {
              id: "user1",
              name: "Ravi Kumar",
              bio: "Spiritual teacher and author",
              avatar_url: "/placeholder.svg?height=32&width=32",
              followerCount: 1200,
              isVerified: true,
            },
            {
              id: "user2",
              name: "Anita Singh",
              bio: "Community organizer",
              avatar_url: "/placeholder.svg?height=32&width=32",
              followerCount: 890,
              isVerified: false,
            },
            {
              id: "user3",
              name: "Vikram Joshi",
              bio: "Philosophy enthusiast",
              avatar_url: "/placeholder.svg?height=32&width=32",
              followerCount: 567,
              isVerified: false,
            },
          ])
        }
      } catch (error) {
        console.error("Failed to fetch suggested users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestedUsers()
  }, [])

  const handleTopicClick = (hashtag: string) => {
    // Navigate to filtered feed
    const searchParams = new URLSearchParams(window.location.search)
    searchParams.set("search", `#${hashtag}`)
    window.history.pushState({}, "", `${window.location.pathname}?${searchParams}`)

    // Trigger search
    window.dispatchEvent(new CustomEvent("hashtagSearch", { detail: hashtag }))

    monitoring.logUserAction("trending_topic_clicked", { hashtag }, user?.id)
  }

  const handleUserFollow = async (userId: string, userName: string) => {
    try {
      const response = await fetch("/api/profiles/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Update UI to show following state
        setSuggestedUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u)))

        monitoring.logUserAction("user_followed", { userId, userName }, user?.id)
      }
    } catch (error) {
      console.error("Failed to follow user:", error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh all data
      await Promise.all([
        fetch("/api/feed/trending-topics").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/platform/stats").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/profiles/suggested").then((r) => (r.ok ? r.json() : null)),
      ])

      monitoring.logUserAction("sidebar_refreshed", {}, user?.id)
    } catch (error) {
      console.error("Failed to refresh sidebar:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      spiritual: "bg-purple-100 text-purple-800",
      philosophy: "bg-blue-100 text-blue-800",
      community: "bg-green-100 text-green-800",
      wellness: "bg-orange-100 text-orange-800",
      culture: "bg-red-100 text-red-800",
      education: "bg-indigo-100 text-indigo-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Trending Topics
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleTopicClick(topic.hashtag)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  {topic.isRising && <ArrowUp className="h-3 w-3 text-green-500" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-gray-900">#{topic.hashtag}</span>
                    {topic.isRising && <Flame className="h-3 w-3 text-red-500" />}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{topic.postCount} posts</span>
                    <span>{topic.engagementCount} interactions</span>
                    <Badge className={`text-xs ${getCategoryColor(topic.category)}`}>{topic.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">+{topic.growthRate}%</div>
                <div className="text-xs text-gray-500">growth</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Community Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-500" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{communityStats.activeUsers.toLocaleString()}</div>
              <div className="text-sm text-blue-700">Active Users</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{communityStats.postsToday}</div>
              <div className="text-sm text-green-700">Posts Today</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{communityStats.discussions}</div>
              <div className="text-sm text-orange-700">Discussions</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{communityStats.newMembers}</div>
              <div className="text-sm text-purple-700">New Members</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="h-5 w-5 text-yellow-500" />
            Suggested Connections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar_url || "/placeholder.svg?height=32&width=32"}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <p className="font-medium text-sm">{user.name}</p>
                    {user.isVerified && <Star className="h-3 w-3 text-yellow-500" />}
                  </div>
                  <p className="text-xs text-gray-500">{user.bio}</p>
                  <p className="text-xs text-gray-400">{user.followerCount} followers</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleUserFollow(user.id, user.name)}>
                Follow
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Popular Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-green-500" />
            Popular Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["meditation", "spirituality", "community", "wisdom", "culture", "wellness", "philosophy", "seva"].map(
              (tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => handleTopicClick(tag)}
                >
                  #{tag}
                </Badge>
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
