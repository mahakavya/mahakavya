"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface CreateCommentData {
  body: string
}

export function useCreateComment(reelId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCommentData) => {
      const response = await fetch("/api/drishya/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reel_id: reelId, ...data }),
      })

      if (!response.ok) {
        throw new Error("Failed to create comment")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reel-comments", reelId] })
      queryClient.invalidateQueries({ queryKey: ["reel-feed"] })
    },
  })
}
