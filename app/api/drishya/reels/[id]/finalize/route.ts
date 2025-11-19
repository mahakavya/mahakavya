import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { z } from "zod"

const finalizeSchema = z.object({
  uploadPath: z.string(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { uploadPath } = finalizeSchema.parse(await request.json())
    const reelId = params.id

    // Verify reel ownership
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("*")
      .eq("id", reelId)
      .eq("author_id", user.id)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Trigger transcoding via Edge Function
    const { data: transcodeData, error: transcodeError } = await supabase.functions.invoke("transcode_reel", {
      body: {
        reelId,
        uploadPath,
      },
    })

    if (transcodeError) {
      console.error("Transcoding failed:", transcodeError)

      // Update reel status to failed
      await supabase.from("reels").update({ status: "FAILED" }).eq("id", reelId)

      return NextResponse.json({ error: "Processing failed" }, { status: 500 })
    }

    // Return the updated reel data
    const { data: updatedReel, error: fetchError } = await supabase
      .from("reels")
      .select(`
        *,
        author:profiles!reels_author_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("id", reelId)
      .single()

    if (fetchError) {
      console.error("Failed to fetch updated reel:", fetchError)
      return NextResponse.json({ error: "Failed to fetch reel" }, { status: 500 })
    }

    return NextResponse.json(updatedReel)
  } catch (error) {
    console.error("Finalize reel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
