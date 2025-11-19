import { useInfiniteQuery } from "@tanstack/react-query"

interface ReelFeedParams {
  type?: "for_you" | "following"
  limit?: number
}

interface ReelFeedResponse {
  reels: any[]
  nextCursor: string | null
  hasMore: boolean
}

async function fetchReelFeed({
  pageParam,
  type = "for_you",
  limit = 10,
}: {
  pageParam?: string
} & ReelFeedParams): Promise<ReelFeedResponse> {
  const params = new URLSearchParams({
    type,
    limit: limit.toString(),
  })

  if (pageParam) {
    params.append("cursor", pageParam)
  }

  const response = await fetch(`/api/drishya/feed?${params}`)

  if (!response.ok) {
    throw new Error("Failed to fetch reel feed")
  }

  return response.json()
}

export function useReelFeed(type: "for_you" | "following" = "for_you", limit = 10) {
  return useInfiniteQuery({
    queryKey: ["reel-feed", type, limit],
    queryFn: ({ pageParam }) => fetchReelFeed({ pageParam, type, limit }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })
}
