"use client"

import { useEffect, useRef } from "react"
import { useForYouFeed } from "@/lib/useForYou"
import { PostCard } from "./PostCard"
import { EmptyState } from "@/components/empty-state"
import { track } from "@/lib/analytics"
import { Loader2 } from "lucide-react"

export function ForYouList() {
  const { data, error, isLoading, isValidating, size, setSize } = useForYouFeed()
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Track feed view
  useEffect(() => {
    track("feed_view_for_you")
  }, [])

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isValidating) {
          setSize(size + 1)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [size, setSize, isLoading, isValidating])

  const posts = data?.flatMap((page) => page.items) || []
  const hasMore = data?.[data.length - 1]?.nextCursor

  if (error) {
    return (
      <EmptyState
        title="Unable to load recommendations"
        description="Please try again later"
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass p-6 animate-pulse">
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
          </div>
        ))}
      </div>
    )
  }

  if (!posts.length) {
    return (
      <EmptyState
        title="No recommendations yet"
        description="Follow some users and interact with posts to get personalized recommendations"
      />
    )
  }

  return (
    <div className="space-y-6" data-testid="for-you-list">
      {posts.map((post, index) => (
        <div key={post.id} className="relative">
          <PostCard
            post={post}
            onCommentClick={() => {
              track("post_open", { postId: post.id, source: "for_you" })
            }}
          />

          {/* Why am I seeing this tooltip */}
          {post.explain && (
            <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-black/80 text-white text-xs p-2 rounded max-w-xs">
                <div className="font-medium mb-1">Why you're seeing this:</div>
                <div className="space-y-1">
                  <div>Recency: {(post.explain.sRec * 100).toFixed(0)}%</div>
                  <div>Engagement: {(post.explain.sEng * 100).toFixed(0)}%</div>
                  {post.explain.sFol > 0 && <div>Following author</div>}
                  {post.explain.sTag > 0 && <div>Tag match: {(post.explain.sTag * 100).toFixed(0)}%</div>}
                  {post.explain.source === "fallback" && <div>Latest fallback</div>}
                </div>
              </div>
            </div>
          )}

          {/* Intersection observer for impressions */}
          <div
            ref={index === posts.length - 5 ? sentinelRef : undefined}
            className="absolute inset-0 pointer-events-none"
            onIntersectionChange={(isVisible) => {
              if (isVisible) {
                track("post_impression", { postId: post.id })
              }
            }}
          />
        </div>
      ))}

      {/* Loading more indicator */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </div>
  )
}
