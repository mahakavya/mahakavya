"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Heart, MessageCircle, Share, User, Volume2, VolumeX, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { linkifyText } from "@/lib/linkify"
import { formatDistanceToNow } from "date-fns"

interface ReelAuthor {
  id: string
  name: string
  avatar_url?: string
}

interface ReelCardProps {
  reel: {
    id: string
    video_url: string
    thumb_url?: string
    caption?: string
    views: number
    likes: number
    created_at: string
    author: ReelAuthor
    viewerLike?: boolean
  }
  onLikeChange?: (reelId: string, liked: boolean, newCount: number) => void
  onCommentClick?: (reelId: string) => void
}

export function ReelCard({ reel, onLikeChange, onCommentClick }: ReelCardProps) {
  const [isLiked, setIsLiked] = useState(reel.viewerLike || false)
  const [likeCount, setLikeCount] = useState(reel.likes)
  const [isLiking, setIsLiking] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const [showHeartAnimation, setShowHeartAnimation] = useState(false)
  const [lastTap, setLastTap] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  // Intersection Observer for autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isIntersecting = entry.intersectionRatio >= 0.7
          setIsVisible(isIntersecting)

          if (videoRef.current) {
            if (isIntersecting) {
              videoRef.current.play()
              setIsPlaying(true)

              // Start view timer
              if (!hasViewed) {
                viewTimeoutRef.current = setTimeout(() => {
                  registerView()
                }, 2000)
              }
            } else {
              videoRef.current.pause()
              setIsPlaying(false)

              // Clear view timer
              if (viewTimeoutRef.current) {
                clearTimeout(viewTimeoutRef.current)
              }
            }
          }
        })
      },
      { threshold: 0.7 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
      if (viewTimeoutRef.current) {
        clearTimeout(viewTimeoutRef.current)
      }
    }
  }, [hasViewed])

  const registerView = useCallback(async () => {
    if (hasViewed) return

    try {
      const response = await fetch("/api/reels/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId: reel.id }),
      })

      if (response.ok) {
        setHasViewed(true)
      }
    } catch (error) {
      console.error("Failed to register view:", error)
    }
  }, [reel.id, hasViewed])

  const handleLike = async () => {
    if (isLiking) return

    const previousLiked = isLiked
    const previousCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)
    setIsLiking(true)

    // Show heart animation if liking
    if (!isLiked) {
      setShowHeartAnimation(true)
      setTimeout(() => setShowHeartAnimation(false), 1000)
    }

    try {
      const response = await fetch("/api/reels/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reelId: reel.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }

      const result = await response.json()
      setIsLiked(result.liked)
      setLikeCount(result.count)

      onLikeChange?.(reel.id, result.liked, result.count)
    } catch (error) {
      // Revert optimistic update
      setIsLiked(previousLiked)
      setLikeCount(previousCount)

      console.error("Like error:", error)
      toast({
        title: "Failed to update like",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const handleVideoClick = (event: React.MouseEvent) => {
    const now = Date.now()
    const timeDiff = now - lastTap

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap - like
      event.preventDefault()
      handleLike()
    } else {
      // Single tap - play/pause
      togglePlayPause()
    }

    setLastTap(now)
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/reels/${reel.id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${reel.author.name}'s reel`,
          text: reel.caption || "Check out this reel!",
          url,
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
          description: "Reel link copied to clipboard.",
        })
      } catch (error) {
        toast({
          title: "Failed to copy link",
          description: "Please try again later.",
          variant: "destructive",
        })
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.code === "Space") {
      event.preventDefault()
      togglePlayPause()
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden snap-start"
      data-testid="reel-card"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Reel by ${reel.author.name}${reel.caption ? `: ${reel.caption}` : ""}`}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        poster={reel.thumb_url}
        className="w-full h-full object-cover cursor-pointer"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        aria-label={`Video by ${reel.author.name}`}
      />

      {/* Heart Animation */}
      {showHeartAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-20 w-20 text-red-500 fill-current animate-ping" />
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 h-10 w-10"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      {/* Actions Sidebar */}
      <div className="absolute right-4 bottom-20 flex flex-col gap-4">
        {/* Author Avatar */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white">
          {reel.author.avatar_url ? (
            <img
              src={reel.author.avatar_url || "/placeholder.svg"}
              alt={reel.author.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`bg-black/50 text-white hover:bg-black/70 h-12 w-12 ${isLiked ? "text-red-500" : ""}`}
            onClick={handleLike}
            disabled={isLiking}
            aria-pressed={isLiked}
            aria-label={`${isLiked ? "Unlike" : "Like"} this reel`}
          >
            <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          <span className="text-white text-xs font-medium" aria-live="polite">
            {likeCount}
          </span>
        </div>

        {/* Comment Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/50 text-white hover:bg-black/70 h-12 w-12"
            onClick={() => onCommentClick?.(reel.id)}
            aria-label="Comment on this reel"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
          <span className="text-white text-xs font-medium">0</span>
        </div>

        {/* Share Button */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 h-12 w-12"
          onClick={handleShare}
          aria-label="Share this reel"
        >
          <Share className="h-6 w-6" />
        </Button>

        {/* More Options */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white hover:bg-black/70 h-12 w-12"
          aria-label="More options"
        >
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold">{reel.author.name}</span>
          <span className="text-sm opacity-75">
            {formatDistanceToNow(new Date(reel.created_at), { addSuffix: true })}
          </span>
        </div>

        {reel.caption && <p className="text-sm leading-relaxed mb-2 line-clamp-3">{linkifyText(reel.caption)}</p>}

        <div className="flex items-center gap-4 text-xs opacity-75">
          <span>{reel.views} views</span>
        </div>
      </div>
    </div>
  )
}
