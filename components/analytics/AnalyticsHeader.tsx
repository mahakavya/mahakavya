"use client"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

const TRACKED_EVENTS = [
  "post_created",
  "post_liked",
  "comment_added",
  "reel_uploaded",
  "reel_liked",
  "message_sent",
  "donation_made",
  "draw_joined",
  "session_booked",
  "subscription_subscribed",
  "subscription_canceled",
  "intro_unlocked",
  "payment_failed",
]

export function AnalyticsHeader() {
  return (
    <div className="space-y-4">
      <PageHeader title="Analytics" subtitle="Events, trends, and audit trail" />

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Tracked Events</h3>
        <div className="flex flex-wrap gap-2">
          {TRACKED_EVENTS.map((event) => (
            <Badge key={event} variant="secondary" className="text-xs">
              {event.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
