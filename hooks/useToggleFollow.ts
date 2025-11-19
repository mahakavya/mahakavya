"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface ToggleFollowParams {
  userId: string
}

export function useToggleFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId }: ToggleFollowParams) => {
      const response = await fetch("/api/profiles/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to toggle follow")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["drishya-feed"] })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
  })
}
