"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Clock,
  MapPin,
  Hash,
  Eye,
  Sparkles,
  Shield,
  Zap,
  Brain,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface PostCardProps {
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
  showAIScore?: boolean
  showBlockchainStatus?: boolean
  showRPAStatus?: boolean
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onShare: (postId: string) => void
}

export function PostCard({
  id,
  content,
  media_urls,
  tags,
  likes_count,
  comments_count,
  shares_count,
  views_count,
  created_at,
  author,
  viewerLike,
  viewerBookmark,
  category,
  location,
  aiScore,
  blockchainVerified,
  rpaProcessed,
  moderationStatus,
  showAIScore,
  showBlockchainStatus,
  showRPAStatus,
  onLike,
  onComment,
  onShare,
}: PostCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isBookmarked, setIsBookmarked] = useState(viewerBookmark || false)
  const [showFullContent, setShowFullContent] = useState(false)

  const handleBookmark = useCallback(async () => {
    try {
      const response = await fetch("/api/feed/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, bookmarked: !isBookmarked }),
      })

      if (response.ok) {
        setIsBookmarked(!isBookmarked)
        toast({
          title: isBookmarked ? "Bookmark removed" : "Post bookmarked",
          description: isBookmarked ? "Removed from your saved posts" : "Added to your saved posts",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to bookmark",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [id, isBookmarked, toast])

  const handleReport = useCallback(async () => {
    try {
      const response = await fetch("/api/feed/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: id, reason: "inappropriate" }),
      })

      if (response.ok) {
        toast({
          title: "Post reported",
          description: "Thank you for helping keep our community safe",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to report",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [id, toast])

  const handleFollow = useCallback(async () => {
    try {
      const response = await fetch("/api/profiles/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: author.id }),
      })

      if (response.ok) {
        toast({
          title: "Following user",
          description: `You are now following ${author.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Failed to follow",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }, [author.id, author.name, toast])

  const truncatedContent = content.length > 300 ? content.substring(0, 300) + "..." : content
  const shouldTruncate = content.length > 300

  const getAIScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getModerationStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "flagged":
        return "text-red-600"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-orange-100">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => window.open(`/parichaya/${author.id}`)}>
              <AvatarImage src={author.avatar_url || "/placeholder.svg"} alt={author.name} />
              <AvatarFallback>{author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors">
                  {author.name}
                </h3>
                {author.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
                {location && (
                  <>
                    <span>•</span>
                    <MapPin className="h-3 w-3" />
                    {location}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* AI/Blockchain/RPA Status Indicators */}
            {showAIScore && aiScore && (
              <Badge variant="outline" className="text-xs">
                <Brain className={`h-3 w-3 mr-1 ${getAIScoreColor(aiScore)}`} />
                AI: {(aiScore * 100).toFixed(0)}%
              </Badge>
            )}
            {showBlockchainStatus && (
              <Badge variant="outline" className="text-xs">
                <Shield className={`h-3 w-3 mr-1 ${blockchainVerified ? "text-green-600" : "text-gray-400"}`} />
                {blockchainVerified ? "Verified" : "Pending"}
              </Badge>
            )}
            {showRPAStatus && (
              <Badge variant="outline" className="text-xs">
                <Zap className={`h-3 w-3 mr-1 ${getModerationStatusColor(moderationStatus)}`} />
                {moderationStatus || "Processed"}
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBookmark}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  {isBookmarked ? "Remove bookmark" : "Bookmark"}
                </DropdownMenuItem>
                {author.id !== user?.id && (
                  <>
                    <DropdownMenuItem onClick={handleFollow}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Follow {author.name}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReport} className="text-red-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {shouldTruncate && !showFullContent ? truncatedContent : content}
            {shouldTruncate && (
              <button
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-orange-600 hover:text-orange-700 ml-2 font-medium"
              >
                {showFullContent ? "Show less" : "Show more"}
              </button>
            )}
          </p>

          {/* Media */}
          {media_urls && media_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {media_urls.map((url, index) => (
                <img
                  key={index}
                  src={url || "/placeholder.svg"}
                  alt={`Post media ${index + 1}`}
                  className="rounded-lg max-h-96 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(url, "_blank")}
                />
              ))}
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => window.open(`/search?q=${encodeURIComponent(`#${tag}`)}`, "_self")}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Post Stats and Actions */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(id)}
              className={`flex items-center space-x-2 transition-colors ${
                viewerLike ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`h-4 w-4 ${viewerLike ? "fill-current" : ""}`} />
              <span>{likes_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComment(id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{comments_count}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>{shares_count}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{views_count}</span>
            </div>
            {isBookmarked && <Bookmark className="h-4 w-4 text-orange-500 fill-current" />}
          </div>
        </div>

        {/* Technology Status Footer */}
        {(showAIScore || showBlockchainStatus || showRPAStatus) && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              {showAIScore && aiScore && (
                <div className="flex items-center space-x-1">
                  <Brain className="h-3 w-3" />
                  <span>AI Quality: {(aiScore * 100).toFixed(0)}%</span>
                </div>
              )}
              {showBlockchainStatus && (
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Blockchain: {blockchainVerified ? "Verified" : "Pending"}</span>
                </div>
              )}
              {showRPAStatus && (
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3" />
                  <span>RPA: {rpaProcessed ? "Processed" : "Queued"}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Secure & Verified</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
