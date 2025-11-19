"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "./supabase"
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface FeedRealtimeCallbacks {
  onPost?: (payload: RealtimePostgresChangesPayload<any>) => void
  onLike?: (payload: RealtimePostgresChangesPayload<any>) => void
  onComment?: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function useFeedRealtime({ onPost, onLike, onComment }: FeedRealtimeCallbacks) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel("realtime:feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          console.log("Realtime: New post", payload)
          onPost?.(payload)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
        },
        (payload) => {
          console.log("Realtime: Like change", payload)
          onLike?.(payload)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
        },
        (payload) => {
          console.log("Realtime: New comment", payload)
          onComment?.(payload)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onPost, onLike, onComment])
}
