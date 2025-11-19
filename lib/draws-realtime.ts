"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase"

export function useDrawRealtime(
  drawId: string,
  {
    onEntry,
    onStatus,
  }: {
    onEntry?: (count: number) => void
    onStatus?: (status: "upcoming" | "closed" | "completed") => void
  },
) {
  const supabase = createClient()
  const onEntryRef = useRef(onEntry)
  const onStatusRef = useRef(onStatus)

  // Update refs
  onEntryRef.current = onEntry
  onStatusRef.current = onStatus

  useEffect(() => {
    if (!drawId) return

    // Subscribe to entries for this draw
    const entriesChannel = supabase
      .channel(`draw-entries-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "entries",
          filter: `draw_id=eq.${drawId}`,
        },
        async () => {
          // Fetch updated count
          const { count } = await supabase
            .from("entries")
            .select("*", { count: "exact", head: true })
            .eq("draw_id", drawId)

          if (count !== null && onEntryRef.current) {
            onEntryRef.current(count)
          }
        },
      )
      .subscribe()

    // Subscribe to draw status changes
    const drawChannel = supabase
      .channel(`draw-status-${drawId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "draws",
          filter: `id=eq.${drawId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as "upcoming" | "closed" | "completed"
          if (newStatus && onStatusRef.current) {
            onStatusRef.current(newStatus)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(entriesChannel)
      supabase.removeChannel(drawChannel)
    }
  }, [drawId, supabase])
}
