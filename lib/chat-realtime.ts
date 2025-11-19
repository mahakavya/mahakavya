"use client"

import { useEffect, useRef } from "react"
import { createSupabaseBrowserClient } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface ChatRealtimeOptions {
  onMessage?: (message: any) => void
  onDelete?: (messageId: string) => void
  onTyping?: (userId: string, isTyping: boolean) => void
  onPresence?: (userId: string, lastSeen: string) => void
}

export function useChatRealtime(conversationId: string, options: ChatRealtimeOptions = {}) {
  const { onMessage, onDelete, onTyping, onPresence } = options
  const channelRef = useRef<RealtimeChannel | null>(null)
  const presenceChannelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const supabase = createSupabaseBrowserClient()

    // Subscribe to messages for this conversation
    channelRef.current = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (onMessage) {
            onMessage(payload.new)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (onDelete) {
            onDelete(payload.old.id)
          }
        },
      )
      .subscribe()

    // Subscribe to presence changes for conversation members
    presenceChannelRef.current = supabase
      .channel(`presence:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presence",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const presence = payload.new
            if (onTyping && "is_typing" in presence) {
              onTyping(presence.user_id, presence.is_typing)
            }
            if (onPresence && "last_seen" in presence) {
              onPresence(presence.user_id, presence.last_seen)
            }
          }
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }
    }
  }, [conversationId, onMessage, onDelete, onTyping, onPresence])

  return {
    cleanup: () => {
      const supabase = createSupabaseBrowserClient()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }
    },
  }
}
