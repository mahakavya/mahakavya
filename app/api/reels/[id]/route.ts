import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { deleteReelFiles, getStoragePathFromUrl } from "@/lib/storage"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reelId = params.id

    // Get reel to check ownership and get file URLs
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("id, author_id, video_url, thumb_url")
      .eq("id", reelId)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Check if user can delete (author or admin)
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    const canDelete = reel.author_id === user.id || profile?.is_admin

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete reel from database
    const { error: deleteError } = await supabase.from("reels").delete().eq("id", reelId)

    if (deleteError) {
      console.error("Failed to delete reel:", deleteError)
      return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 })
    }

    // Delete files from storage (best effort)
    try {
      const filesToDelete = []

      if (reel.video_url) {
        const videoPath = getStoragePathFromUrl(reel.video_url)
        if (videoPath) filesToDelete.push(videoPath)
      }

      if (reel.thumb_url) {
        const thumbPath = getStoragePathFromUrl(reel.thumb_url)
        if (thumbPath) filesToDelete.push(thumbPath)
      }

      if (filesToDelete.length > 0) {
        await deleteReelFiles(filesToDelete)
      }
    } catch (storageError) {
      console.error("Failed to delete reel files from storage:", storageError)
      // Don't fail the request if storage cleanup fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reel deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
