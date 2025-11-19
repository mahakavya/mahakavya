"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface UseSahayaRealtimeProps {
  listenerId?: string
  sessionId?: string
  onSlot?: (slot: any) => void
  onSession?: (session: any) => void
}

export function useSahayaRealtime({ listenerId, sessionId, onSlot, onSession }: UseSahayaRealtimeProps) {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channels: any[] = []

    // Subscribe to slots changes for a specific listener
    if (listenerId && onSlot) {
      const slotsChannel = supabase
        .channel(`slots:${listenerId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "slots",
            filter: `listener_id=eq.${listenerId}`,
          },
          (payload) => {
            onSlot(payload.new || payload.old)
          },
        )
        .subscribe()

      channels.push(slotsChannel)
    }

    // Subscribe to session changes for a specific session
    if (sessionId && onSession) {
      const sessionChannel = supabase
        .channel(`session:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            onSession(payload.new || payload.old)
          },
        )
        .subscribe()

      channels.push(sessionChannel)
    }

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [listenerId, sessionId, onSlot, onSession])
}
