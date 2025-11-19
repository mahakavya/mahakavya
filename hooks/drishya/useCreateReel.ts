"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface CreateReelData {
  caption?: string
  tags: string[]
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
}

export function useCreateReel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateReelData) => {
      const response = await fetch("/api/drishya/reels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create reel")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reel-feed"] })
    },
  })
}
