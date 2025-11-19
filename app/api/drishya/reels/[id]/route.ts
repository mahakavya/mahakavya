import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reelId = params.id

    // Get reel with author details
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select(`
        *,
        author:user_profiles!author_id(
          id,
          display_name,
          avatar_url,
          username
        ),
        is_liked:reel_likes!inner(user_id),
        is_bookmarked:reel_bookmarks!inner(user_id)
      `)
      .eq("id", reelId)
      .eq("reel_likes.user_id", user.id)
      .eq("reel_bookmarks.user_id", user.id)
      .single()

    if (reelError) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Check if user can view this reel
    const canView = await supabase.rpc("can_view_reel", {
      r: reel,
      uid: user.id,
    })

    if (!canView.data) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({ reel })
  } catch (error) {
    console.error("Get reel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const reelId = params.id

    // Get reel to check ownership and get file paths
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("*")
      .eq("id", reelId)
      .eq("author_id", user.id)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Delete associated files from storage
    const filesToDelete = []

    if (reel.upload_path) {
      filesToDelete.push({ bucket: "drishya-uploads", path: reel.upload_path })
    }

    if (reel.hls_url) {
      // Extract path from URL and delete HLS files
      const hlsPath = `${reelId}/playlist.m3u8`
      const segmentPath = `${reelId}/segment0.ts`
      filesToDelete.push({ bucket: "drishya-stream", path: hlsPath }, { bucket: "drishya-stream", path: segmentPath })
    }

    if (reel.thumb_url) {
      const thumbPath = `${reelId}/thumb.jpg`
      filesToDelete.push({ bucket: "drishya-thumbs", path: thumbPath })
    }

    // Delete files from storage
    for (const file of filesToDelete) {
      await supabase.storage.from(file.bucket).remove([file.path])
    }

    // Delete reel record (cascades to related tables)
    const { error: deleteError } = await supabase.from("reels").delete().eq("id", reelId)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete reel" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete reel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
