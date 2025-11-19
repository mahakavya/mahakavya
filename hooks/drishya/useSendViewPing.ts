"use client"

import { useMutation } from "@tanstack/react-query"

export function useSendViewPing(reelId: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/drishya/reels/${reelId}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to send view ping")
      }

      return response.json()
    },
  })
}
