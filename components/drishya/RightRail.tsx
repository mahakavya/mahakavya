"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal } from "lucide-react"
import { useToggleLike } from "@/hooks/drishya/useToggleLike"
import { useToggleBookmark } from "@/hooks/drishya/useToggleBookmark"
import { useToast } from "@/hooks/use-toast"

interface RightRailProps {
  reel: {
    id: string
    likes_count: number
    comments_count: number
    views_count: number
    is_liked: boolean
    is_bookmarked: boolean
  }
  onCommentClick?: () => void
}

export function RightRail({ reel, onCommentClick }: RightRailProps) {
  const [isLiked, setIsLiked] = useState(reel.is_liked)
  const [isBookmarked, setIsBookmarked] = useState(reel.is_bookmarked)
  const [likesCount, setLikesCount] = useState(reel.likes_count)

  const { toast } = useToast()
  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleBookmark } = useToggleBookmark()

  const handleLike = () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1))

    toggleLike(
      { reelId: reel.id },
      {
        onError: () => {
          // Revert on error
          setIsLiked(!newLikedState)
          setLikesCount((prev) => (newLikedState ? prev - 1 : prev + 1))
          toast({
            title: "Error",
            description: "Failed to update like. Please try again.",
            variant: "destructive",
          })
        },
      },
    )
  }

  const handleBookmark = () => {
    const newBookmarkedState = !isBookmarked
    setIsBookmarked(newBookmarkedState)

    toggleBookmark(
      { reelId: reel.id },
      {
        onError: () => {
          // Revert on error
          setIsBookmarked(!newBookmarkedState)
          toast({
            title: "Error",
            description: "Failed to update bookmark. Please try again.",
            variant: "destructive",
          })
        },
      },
    )
  }

  const handleShare = async () => {
    const shareData = {
      title: "Check out this amazing reel!",
      url: `${window.location.origin}/drishya/reel/${reel.id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        toast({
          title: "Link copied!",
          description: "Reel link copied to clipboard",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <div className="flex flex-col items-center space-y-6 py-4">
      {/* Like Button */}
      <div className="flex flex-col items-center">
        <Button
          onClick={handleLike}
          className={`rounded-full w-12 h-12 p-0 ${
            isLiked ? "bg-red-600 hover:bg-red-700 text-white" : "bg-black/50 hover:bg-black/70 text-white"
          }`}
        >
          <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
        </Button>
        <span className="text-white text-xs mt-1 font-medium">{formatCount(likesCount)}</span>
      </div>

      {/* Comment Button */}
      <div className="flex flex-col items-center">
        <Button
          onClick={onCommentClick}
          className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 p-0"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
        <span className="text-white text-xs mt-1 font-medium">{formatCount(reel.comments_count)}</span>
      </div>

      {/* Bookmark Button */}
      <div className="flex flex-col items-center">
        <Button
          onClick={handleBookmark}
          className={`rounded-full w-12 h-12 p-0 ${
            isBookmarked ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-black/50 hover:bg-black/70 text-white"
          }`}
        >
          <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
        </Button>
      </div>

      {/* Share Button */}
      <div className="flex flex-col items-center">
        <Button onClick={handleShare} className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 p-0">
          <Share className="w-6 h-6" />
        </Button>
      </div>

      {/* More Options */}
      <div className="flex flex-col items-center">
        <Button className="bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 p-0">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </div>

      {/* View Count */}
      <div className="text-center">
        <div className="text-white text-xs font-medium">{formatCount(reel.views_count)}</div>
        <div className="text-gray-300 text-xs">views</div>
      </div>
    </div>
  )
}
