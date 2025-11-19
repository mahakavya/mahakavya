"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ReelCard } from "./ReelCard"
import { UploaderModal } from "./UploaderModal"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reel {
  id: string
  author_id: string
  caption?: string
  tags: string[]
  hls_url?: string
  thumb_url?: string
  status: "PROCESSING" | "READY" | "FAILED"
  likes_count: number
  comments_count: number
  views_count: number
  duration_seconds?: number
  created_at: string
  author: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
  is_liked: boolean
  is_bookmarked: boolean
  is_following: boolean
}

interface DrishyaFeedProps {
  onCommentClick?: (reelId: string) => void
}

export function DrishyaFeed({ onCommentClick }: DrishyaFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showUploader, setShowUploader] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["drishya-feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/drishya/feed?page=${pageParam}&limit=10`)
      if (!response.ok) {
        throw new Error("Failed to fetch reels")
      }
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined
    },
    initialPageParam: 0,
  })

  const reels = data?.pages.flatMap((page) => page.reels) || []

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      } else if (e.key === "ArrowDown" && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (e.key === " ") {
        e.preventDefault()
        // Toggle play/pause for current reel
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, reels.length])

  // Handle scroll navigation
  const handleScroll = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      if (e.deltaY > 0 && currentIndex < reels.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else if (e.deltaY < 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1)
      }
    },
    [currentIndex, reels.length],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleScroll, { passive: false })
    return () => container.removeEventListener("wheel", handleScroll)
  }, [handleScroll])

  // Load more reels when approaching end
  useEffect(() => {
    if (currentIndex >= reels.length - 3 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [currentIndex, reels.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Handle touch/swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isUpSwipe = distance > 50
    const isDownSwipe = distance < -50

    if (isUpSwipe && currentIndex < reels.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else if (isDownSwipe && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const handleReelUploaded = (reel: Reel) => {
    setShowUploader(false)
    toast({
      title: "Video uploaded successfully!",
      description: "Your reel is being processed and will appear in the feed soon.",
    })
  }

  if (isLoading) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p>Loading amazing videos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="mb-4">Failed to load videos</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <div className="text-white text-center max-w-sm px-6">
          <div className="text-6xl mb-6">🎬</div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Drishya!</h2>
          <p className="text-gray-400 mb-6">Be the first to share amazing videos with the community.</p>
          <Button onClick={() => setShowUploader(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload First Video
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex flex-col transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(-${currentIndex * 100}vh)`,
            height: `${reels.length * 100}vh`,
          }}
        >
          {reels.map((reel, index) => (
            <div key={reel.id} className="h-screen w-full flex-shrink-0">
              <ReelCard reel={reel} isActive={index === currentIndex} onCommentClick={onCommentClick} />
            </div>
          ))}
        </div>
      </div>

      {/* Upload FAB */}
      <Button
        onClick={() => setShowUploader(true)}
        className="fixed bottom-24 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Navigation indicators */}
      <div className="fixed right-2 top-1/2 transform -translate-y-1/2 z-40 space-y-2">
        {reels.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx
          return (
            <div
              key={actualIndex}
              className={`w-1 h-8 rounded-full transition-colors ${
                actualIndex === currentIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          )
        })}
      </div>

      {/* Upload Modal */}
      <UploaderModal isOpen={showUploader} onClose={() => setShowUploader(false)} onReelUploaded={handleReelUploaded} />
    </div>
  )
}
