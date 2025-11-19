export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { SearchQuerySchema } from "@/lib/validators"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())

  const { q, type, page = 1, limit = 20 } = SearchQuerySchema.parse(params)

    const sb = createSupabaseServerClient()

    // Sanitize query for full-text search
    const sanitizedQuery = q.replace(/[^\w\s#@]/g, " ").trim()
    if (!sanitizedQuery) {
      return NextResponse.json({ items: [], nextCursor: null })
    }

    const results: any[] = []
    let nextCursor: string | null = null

  // Compute offset from page (SearchQuerySchema uses `page`)
  const pageNumber = Number(page) || 1
  const offset = Math.max(0, (pageNumber - 1) * limit)

  if (type === "all" || type === "posts") {
      const { data: posts } = await sb
        .from("posts")
        .select(`
          id, body, created_at, author_id,
          profiles!posts_author_id_fkey(name, email)
        `)
        .eq("is_hidden", false)
        .or(`search_tsv.fts(simple).${sanitizedQuery},body.ilike.%${sanitizedQuery}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (posts) {
        results.push(
    ...posts.map((post: any) => ({
            kind: "post",
            id: post.id,
            body: post.body,
            created_at: post.created_at,
            href: `/samvaaha?post=${post.id}`,
            score: 1.0,
            author: post.profiles?.name || post.profiles?.email || "Unknown",
          })),
        )
      }
    }

  if (type === "all" || type === "reels") {
      const { data: reels } = await sb
        .from("reels")
        .select(`
          id, caption, video_url, thumb_url, created_at, author_id,
          profiles!reels_author_id_fkey(name, email)
        `)
        .eq("is_hidden", false)
        .or(`search_tsv.fts(simple).${sanitizedQuery},caption.ilike.%${sanitizedQuery}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (reels) {
        results.push(
    ...reels.map((reel: any) => ({
            kind: "reel",
            id: reel.id,
            caption: reel.caption || "",
            created_at: reel.created_at,
            href: `/drishya?reel=${reel.id}`,
            score: 1.0,
            thumb_url: reel.thumb_url,
            author: reel.profiles?.name || reel.profiles?.email || "Unknown",
          })),
        )
      }
    }

  if (type === "all" || type === "campaigns") {
      const { data: campaigns } = await sb
        .from("campaigns")
        .select(`
          id, title, description, goal_amount, raised_amount, 
          cover_url, created_at, creator_id,
          profiles!campaigns_creator_id_fkey(name, email)
        `)
        .eq("status", "live")
        .or(`search_tsv.fts(simple).${sanitizedQuery},title.ilike.%${sanitizedQuery}%`)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (campaigns) {
        results.push(
    ...campaigns.map((campaign: any) => ({
            kind: "campaign",
            id: campaign.id,
            title: campaign.title,
            description: campaign.description,
            created_at: campaign.created_at,
            href: `/nivedana/${campaign.id}`,
            score: 1.0,
            cover_url: campaign.cover_url,
            goal_amount: campaign.goal_amount,
            raised_amount: campaign.raised_amount,
            creator: campaign.profiles?.name || campaign.profiles?.email || "Unknown",
          })),
        )
      }
    }

    // Sort by created_at desc and limit
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const limitedResults = results.slice(0, limit)

    // Set next cursor (page token) if we have more results
    if (limitedResults.length === limit) {
      nextCursor = String(pageNumber + 1)
    }

    return NextResponse.json({
      items: limitedResults,
      nextCursor,
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
