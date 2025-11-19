"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface ToggleLikeParams {
  reelId: string
}

export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reelId }: ToggleLikeParams) => {
      const response = await fetch(`/api/drishya/reels/${reelId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch feed data
      queryClient.invalidateQueries({ queryKey: ["drishya-feed"] })
    },
  })
}
