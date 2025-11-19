"use client"
import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

export function useNotifyRealtime(userId: string | null, onInsert: (n: any) => void) {
  useEffect(() => {
    if (!userId) return
    const sb = createSupabaseBrowserClient()
    const ch = sb
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => onInsert(payload.new),
      )
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [userId, onInsert])
}
