import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { ENV, assertServerEnv } from "@/config/env"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TrackEventSchema = z.enum([
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
])

const TrackSchema = z.object({
  name: TrackEventSchema,
  props: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()

    const body = await request.json()
    const { name, props } = TrackSchema.parse(body)

    // Validate props size (max 2KB)
    if (props && JSON.stringify(props).length > 2048) {
      return NextResponse.json({ error: "Props too large" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(ENV.SUPABASE_URL!, ENV.SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    // Get current user (optional for tracking)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert event
    const { error } = await supabase.from("events").insert({
      user_id: user?.id || null,
      name,
      props: props || {},
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Failed to track event:", error)
      return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track API error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
