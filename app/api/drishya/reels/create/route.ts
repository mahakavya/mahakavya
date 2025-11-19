import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"
import { extractHashTags } from "@/lib/hashTags"

const createReelSchema = z.object({
  caption: z.string().max(2200).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).default("PUBLIC"),
  audioTitle: z.string().optional(),
  audioUrl: z.string().url().optional(),
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

    // Validate request body
    const body = await request.json()
    const { caption, tags, visibility, audioTitle, audioUrl } = createReelSchema.parse(body)

    // Extract hashtags from caption
    const extractedTags = caption ? extractHashTags(caption) : []
    const allTags = [...new Set([...(tags || []), ...extractedTags])]

    // Create reel record
    const reelId = crypto.randomUUID()
    const uploadPath = `${user.id}/${reelId}.mp4`

    const { data: reel, error: insertError } = await supabase
      .from("reels")
      .insert({
        id: reelId,
        author_id: user.id,
        caption,
        tags: allTags,
        visibility,
        audio_title: audioTitle,
        audio_url: audioUrl,
        upload_path: uploadPath,
        status: "PROCESSING",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create reel:", insertError)
      return NextResponse.json({ error: "Failed to create reel" }, { status: 500 })
    }

    // Generate signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("drishya-uploads")
      .createSignedUploadUrl(uploadPath, {
        upsert: true,
      })

    if (uploadError) {
      console.error("Failed to create upload URL:", uploadError)
      return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
    }

    return NextResponse.json({
      reelId,
      uploadUrl: uploadData.signedUrl,
      uploadPath,
      token: uploadData.token,
    })
  } catch (error) {
    console.error("Create reel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
