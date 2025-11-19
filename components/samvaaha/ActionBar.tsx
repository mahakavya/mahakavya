"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToggleLike, useToggleBookmark } from "@/hooks/useSamvaaha"
import type { Post } from "@/lib/supabase/types"
import { Heart, MessageCircle, Share, Bookmark, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface ActionBarProps {
  post: Post
  onCommentClick?: () => void
}

export function ActionBar({ post, onCommentClick }: ActionBarProps) {
  const toggleLike = useToggleLike(post.id)
  const toggleBookmark = useToggleBookmark(post.id)
  const [shareLoading, setShareLoading] = useState(false)

  const handleLike = async () => {
    try {
      await toggleLike.mutateAsync()
    } catch (error) {
      toast.error("Failed to update like")
    }
  }

  const handleBookmark = async () => {
    try {
      await toggleBookmark.mutateAsync()
      toast.success(post.viewerBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
    } catch (error) {
      toast.error("Failed to update bookmark")
    }
  }

  const handleShare = async () => {
    setShareLoading(true)
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.author.display_name}`,
          text: post.body || "Check out this post",
          url: `${window.location.origin}/samvaaha/posts/${post.id}`,
        })
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/samvaaha/posts/${post.id}`)
        toast.success("Link copied to clipboard")
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast.error("Failed to share post")
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/50">
      <div className="flex items-center gap-1">
        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 ${post.viewerHasLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
          onClick={handleLike}
          disabled={toggleLike.isPending}
        >
          {toggleLike.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Heart className={`h-4 w-4 mr-1 ${post.viewerHasLiked ? "fill-current" : ""}`} />
            </motion.div>
          )}
          <span className="text-xs">{post.like_count}</span>
        </Button>

        {/* Comment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-blue-500"
          onClick={onCommentClick}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <MessageCircle className="h-4 w-4 mr-1" />
          </motion.div>
          <span className="text-xs">{post.comment_count}</span>
        </Button>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-green-500"
          onClick={handleShare}
          disabled={shareLoading}
        >
          {shareLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Share className="h-4 w-4 mr-1" />
            </motion.div>
          )}
          <span className="text-xs">{post.share_count}</span>
        </Button>
      </div>

      {/* Bookmark Button */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 px-2 ${post.viewerBookmarked ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}`}
        onClick={handleBookmark}
        disabled={toggleBookmark.isPending}
      >
        {toggleBookmark.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Bookmark className={`h-4 w-4 ${post.viewerBookmarked ? "fill-current" : ""}`} />
          </motion.div>
        )}
      </Button>
    </div>
  )
}
