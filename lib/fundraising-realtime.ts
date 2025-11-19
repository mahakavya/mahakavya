"use client"

import { useEffect } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface UseCampaignRealtimeProps {
  onDonation?: (amount: number) => void
}

export function useCampaignRealtime(campaignId: string, { onDonation }: UseCampaignRealtimeProps) {
  useEffect(() => {
    if (!campaignId) return

    const supabase = createSupabaseBrowserClient()

    // Subscribe to donations for this campaign
    const channel = supabase
      .channel(`campaign:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "donations",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("New donation received:", payload)
          if (payload.new && onDonation) {
            onDonation(payload.new.amount as number)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("Donation updated:", payload)
          if (payload.new && payload.old && onDonation) {
            const oldStatus = payload.old.status
            const newStatus = payload.new.status
            // Only trigger if status changed to captured
            if (oldStatus !== "captured" && newStatus === "captured") {
              onDonation(payload.new.amount as number)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [campaignId, onDonation])
}
