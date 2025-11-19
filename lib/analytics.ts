export type TrackEvent =
  | "post_created"
  | "post_liked"
  | "comment_added"
  | "reel_uploaded"
  | "reel_liked"
  | "message_sent"
  | "donation_made"
  | "draw_joined"
  | "session_booked"
  | "subscription_subscribed"
  | "subscription_canceled"
  | "intro_unlocked"
  | "payment_failed"

export async function track(name: TrackEvent, props?: Record<string, any>) {
  // fire-and-forget; non-blocking. Call API route (server inserts with viewer id).
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, props }),
      keepalive: true,
    })
  } catch {
    // Silently fail - analytics should never break user experience
  }
}
