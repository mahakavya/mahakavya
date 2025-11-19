"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ReelCard } from "./ReelCard"
import { EmptyState } from "@/components/empty-state"
import { useReelsRealtime } from "@/lib/reels-realtime"
import { Video, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reel {
  id: string
  video_url: string
  thumb_url?: string
  caption?: string
  views: number
  likes: number
  created_at: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
  viewerLike?: boolean
}

interface ReelsFeedProps {
  onCommentClick?: (reelId: string) => void
}

export function ReelsFeed({ onCommentClick }: ReelsFeedProps) {
  const [reels, setReels] = useState<Reel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const fetchReels = useCallback(
    async (cursor?: string, replace = false) => {
      try {
        if (!replace && cursor) {
          setIsLoadingMore(true)
        } else if (replace) {
          setIsLoading(true)
        }

        const params = new URLSearchParams({
          limit: "15",
        })
        if (cursor) {
          params.set("cursor", cursor)
        }

        const response = await fetch(`/api/reels?${params}`)
        if (!response.ok) {
          throw new Error("Failed to fetch reels")
        }

        const data = await response.json()

        if (replace) {
          setReels(data.items)
        } else {
          setReels((prev) => [...prev, ...data.items])
        }

        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
        setError(null)
      } catch (error) {
        console.error("Failed to fetch reels:", error)
        setError(error instanceof Error ? error.message : "Failed to load reels")
        toast({
          title: "Failed to load reels",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [toast],
  )

  // Initial load
  useEffect(() => {
    fetchReels(undefined, true)
  }, [fetchReels])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchReels(nextCursor)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchReels, nextCursor, hasMore, isLoadingMore])

  // Realtime updates
  useReelsRealtime({
    onInsert: useCallback((payload) => {
      if (payload.new) {
        const newReel = {
          ...payload.new,
          author: payload.new.profiles || { id: payload.new.author_id, name: "Unknown", avatar_url: null },
          viewerLike: false,
        }
        setReels((prev) => {
          // Avoid duplicates
          if (prev.some((r) => r.id === newReel.id)) return prev
          return [newReel, ...prev]
        })
      }
    }, []),
    onLike: useCallback((payload) => {
      if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
        // Update like count for the affected reel
        setReels((prev) =>
          prev.map((reel) => {
            if (reel.id === payload.new?.reel_id || reel.id === payload.old?.reel_id) {
              const isLiked = payload.eventType === "INSERT"
              return {
                ...reel,
                likes: isLiked ? reel.likes + 1 : reel.likes - 1,
                viewerLike: payload.new?.user_id === payload.new?.user_id ? isLiked : reel.viewerLike,
              }
            }
            return reel
          }),
        )
      }
    }, []),
  })

  const handleLikeChange = (reelId: string, liked: boolean, newCount: number) => {
    setReels((prev) =>
      prev.map((reel) => {
        if (reel.id === reelId) {
          return {
            ...reel,
            likes: newCount,
            viewerLike: liked,
          }
        }
        return reel
      }),
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center" data-testid="reels-feed">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (error && reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => fetchReels(undefined, true)} className="text-blue-600 hover:text-blue-700 font-medium">
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <EmptyState
          icon={Video}
          title="Be the first to post a reel"
          subtitle="Share your creativity with the community. Upload your first reel to get started!"
          action={{
            label: "Upload Reel",
            onClick: () => {
              // This would be handled by parent component
              console.log("Upload reel clicked")
            },
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide"
      data-testid="reels-feed"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {reels.map((reel) => (
        <ReelCard key={reel.id} reel={reel} onLikeChange={handleLikeChange} onCommentClick={onCommentClick} />
      ))}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && !isLoadingMore && <div ref={sentinelRef} className="h-4" />}

      {/* End of feed */}
      {!hasMore && reels.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end</p>
        </div>
      )}
    </div>
  )
}
