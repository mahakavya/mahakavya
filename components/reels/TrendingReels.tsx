"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Eye, Heart, MessageCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TrendingReel {
  id: string
  title: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  views: number
  likes: number
  comments: number
  trendingScore: number
  hashtags: string[]
  thumbnail_url?: string
}

export function TrendingReels() {
  const [trendingReels, setTrendingReels] = useState<TrendingReel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendingReels()
  }, [])

  const fetchTrendingReels = async () => {
    try {
      const response = await fetch("/api/reels/trending")
      if (response.ok) {
        const data = await response.json()
        setTrendingReels(data.reels || [])
      }
    } catch (error) {
      console.error("Failed to fetch trending reels:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Trending Reels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          Trending Reels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingReels.slice(0, 5).map((reel, index) => (
            <div
              key={reel.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                  {reel.thumbnail_url ? (
                    <img
                      src={reel.thumbnail_url || "/placeholder.svg"}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Eye className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <Badge
                  variant="default"
                  className="absolute -top-1 -left-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {index + 1}
                </Badge>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={reel.author.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{reel.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-300 truncate">{reel.author.name}</span>
                </div>

                <p className="text-white text-sm font-medium truncate mb-1">{reel.title}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(reel.views)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(reel.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {formatNumber(reel.comments)}
                  </span>
                </div>

                {reel.hashtags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {reel.hashtags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right">
                <Badge variant="secondary" className="text-xs">
                  {reel.trendingScore}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
