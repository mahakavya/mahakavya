export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitTags = Number.parseInt(searchParams.get("limitTags") || "20", 10)
    const limitCampaigns = Number.parseInt(searchParams.get("limitCampaigns") || "8", 10)

  const sb = createSupabaseServerClient()

    // Get trending hashtags
    const { data: tags } = await sb.from("v_trending_hashtags").select("tag, cnt").limit(limitTags)

    // Get trending campaigns
    const { data: campaigns } = await sb
      .from("v_trending_campaigns_24h")
      .select("id, title, amount_24h, donors_24h")
      .limit(limitCampaigns)

    return NextResponse.json({
      tags: tags?.map((t: { tag: string; cnt: number }) => ({ tag: t.tag, count: t.cnt })) || [],
      campaigns: campaigns || [],
    })
  } catch (error) {
    console.error("Trending error:", error)
    return NextResponse.json({ error: "Failed to fetch trending data" }, { status: 500 })
  }
}
