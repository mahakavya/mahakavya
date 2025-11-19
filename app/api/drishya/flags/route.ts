import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const flagSchema = z.object({
  reelId: z.string().uuid(),
  reason: z.enum(["spam", "harassment", "hate_speech", "violence", "nudity", "copyright", "misinformation", "other"]),
  description: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reelId, reason, description } = flagSchema.parse(body)

    // Check if reel exists
    const { data: reel, error: reelError } = await supabase.from("reels").select("id").eq("id", reelId).single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Check if user already flagged this reel
    const { data: existingFlag, error: checkError } = await supabase
      .from("content_flags")
      .select("id")
      .eq("content_type", "reel")
      .eq("content_id", reelId)
      .eq("reporter_id", user.id)
      .single()

    if (existingFlag) {
      return NextResponse.json({ error: "Already flagged" }, { status: 400 })
    }

    // Create flag
    const { error: flagError } = await supabase.from("content_flags").insert({
      content_type: "reel",
      content_id: reelId,
      reporter_id: user.id,
      reason,
      description,
      status: "pending",
    })

    if (flagError) {
      return NextResponse.json({ error: "Failed to flag content" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Flag content error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
