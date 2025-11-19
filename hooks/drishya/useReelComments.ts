"use client"

import { useInfiniteQuery } from "@tanstack/react-query"

export function useReelComments(reelId: string) {
  return useInfiniteQuery({
    queryKey: ["reel-comments", reelId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        reel_id: reelId,
        limit: "20",
        ...(pageParam && { cursor: pageParam }),
      })

      const response = await fetch(`/api/drishya/comments?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch comments")
      }

      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })
}
