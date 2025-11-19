"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useToggleCommentLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(`/api/drishya/comments/${commentId}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle comment like")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reel-comments"] })
    },
  })
}
