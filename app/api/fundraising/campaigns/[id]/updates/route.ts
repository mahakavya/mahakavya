import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()

    const { data: updates, error } = await supabase
      .from("campaign_updates")
      .select(`
        id,
        title,
        content,
        media_url,
        created_at,
        author:profiles!campaign_updates_author_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .eq("campaign_id", params.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch updates:", error)
      return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 })
    }

    return NextResponse.json({ items: updates || [] })
  } catch (error) {
    console.error("Updates fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user owns the campaign
    const { data: campaign } = await supabase.from("campaigns").select("owner_id").eq("id", params.id).single()

    if (!campaign || campaign.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Campaign not found or access denied" }, { status: 404 })
    }

    const { title, content, media_url } = await request.json()

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const { data: update, error } = await supabase
      .from("campaign_updates")
      .insert({
        campaign_id: params.id,
        author_id: session.user.id,
        title: title.trim(),
        content: content.trim(),
        media_url: media_url || null,
      })
      .select(`
        id,
        title,
        content,
        media_url,
        created_at,
        author:profiles!campaign_updates_author_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error("Failed to create update:", error)
      return NextResponse.json({ error: "Failed to create update" }, { status: 500 })
    }

    return NextResponse.json(update)
  } catch (error) {
    console.error("Update creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
