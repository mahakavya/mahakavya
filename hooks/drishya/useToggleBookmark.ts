"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface ToggleBookmarkParams {
  reelId: string
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reelId }: ToggleBookmarkParams) => {
      const response = await fetch(`/api/drishya/reels/${reelId}/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to toggle bookmark")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch feed data
      queryClient.invalidateQueries({ queryKey: ["drishya-feed"] })
    },
  })
}
