"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "./supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface ReelsRealtimeCallbacks {
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
  onLike?: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function useReelsRealtime({ onInsert, onLike }: ReelsRealtimeCallbacks) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel("realtime:reels")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reels",
        },
        (payload) => {
          console.log("Realtime: New reel", payload)
          onInsert?.(payload)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reel_likes",
        },
        (payload) => {
          console.log("Realtime: Reel like change", payload)
          onLike?.(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onInsert, onLike])
}
