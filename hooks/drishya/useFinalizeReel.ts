"use client"

import { useMutation } from "@tanstack/react-query"

export function useFinalizeReel() {
  return useMutation({
    mutationFn: async (reelId: string) => {
      const response = await fetch(`/api/drishya/reels/${reelId}/finalize`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to finalize reel")
      }

      return response.json()
    },
  })
}
