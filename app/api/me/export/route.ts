import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import JSZip from "jszip"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const zip = new JSZip()

    // Export profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (profile) {
      zip.file("profile.json", JSON.stringify(profile, null, 2))
    }

    // Export posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id, body, media_urls, tags, created_at, updated_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })

    if (posts?.length) {
      zip.file("posts.json", JSON.stringify(posts, null, 2))
    }

    // Export comments
    const { data: comments } = await supabase
      .from("post_comments")
      .select("id, post_id, body, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })

    if (comments?.length) {
      zip.file("comments.json", JSON.stringify(comments, null, 2))
    }

    // Export reels
    const { data: reels } = await supabase
      .from("reels")
      .select("id, video_url, caption, tags, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })

    if (reels?.length) {
      zip.file("reels.json", JSON.stringify(reels, null, 2))
    }

    // Export messages (sent only)
    const { data: messages } = await supabase
      .from("messages")
      .select("id, conversation_id, body, created_at")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false })

    if (messages?.length) {
      zip.file("messages.json", JSON.stringify(messages, null, 2))
    }

    // Export donations
    const { data: donations } = await supabase
      .from("donations")
      .select("id, campaign_id, amount, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (donations?.length) {
      zip.file("donations.json", JSON.stringify(donations, null, 2))
    }

    // Export campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, description, goal_amount, raised_amount, status, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (campaigns?.length) {
      zip.file("campaigns.json", JSON.stringify(campaigns, null, 2))
    }

    // Add metadata
    const metadata = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      export_version: "1.0",
    }
    zip.file("metadata.json", JSON.stringify(metadata, null, 2))

    // Generate zip
    const zipBuffer = await zip.generateAsync({ type: "uint8array" })

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="mahakavya-data-${user.id}.zip"`,
      },
    })
  } catch (error) {
    console.error("Data export failed:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
