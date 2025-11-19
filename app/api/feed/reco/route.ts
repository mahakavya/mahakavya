import type { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getUserInterests, recencyScore, engagementScore, tagScore } from "@/lib/reco"
import { RECO } from "@/config/reco"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET ?cursor=<iso>&limit=<n=20>
 * Returns ranked posts for current user with score breakdown.
 * Excludes author's own posts and hidden content.
 * Cursor = created_at ISO of the last item; we keep ranking within a rolling window.
 */
export async function GET(req: NextRequest) {
  try {
    const sb = createSupabaseServerClient()
    const {
      data: { session },
    } = await sb.auth.getSession()

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }

    const userId = session.user.id
    const url = new URL(req.url)
    const cursor = url.searchParams.get("cursor") || ""
    const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "20"), 50)

    // Get user interests
    const userInterests = await getUserInterests(sb, userId)

    // Get user's followees
    const { data: followees } = await sb.from("follows").select("followee_id").eq("follower_id", userId)

    const followeeIds =
      (followees as Array<{ followee_id?: string; following_id?: string }> | undefined)
        ?.map((f) => f.followee_id ?? f.following_id)
        .filter(Boolean) ?? []

    // Build candidate window query
    let candidatesQuery = sb
      .from("posts")
      .select(`
        id, author_id, body, media_urls, tags, created_at, like_count, comment_count,
        profiles!posts_author_id_fkey(id, name, avatar_url),
        v_post_engagement_6h(likes6h, comments6h)
      `)
      .eq("is_hidden", false)
      .neq("author_id", userId) // Exclude own posts

    // Apply cursor for pagination
    if (cursor) {
      candidatesQuery = candidatesQuery.lt("created_at", cursor)
    }

    // Candidate window: last 72h OR followees' posts up to 7 days
    const now = new Date()
    const hours72Ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    if (followeeIds.length > 0) {
      candidatesQuery = candidatesQuery.or(
        `created_at.gte.${hours72Ago},and(author_id.in.(${followeeIds.join(",")}),created_at.gte.${days7Ago})`,
      )
    } else {
      candidatesQuery = candidatesQuery.gte("created_at", hours72Ago)
    }

    const { data: candidates, error } = await candidatesQuery.order("created_at", { ascending: false }).limit(limit * 3) // Get more candidates to rank

    if (error) throw error

    if (!candidates?.length) {
      return Response.json({ items: [], nextCursor: null })
    }

    // Score each candidate
  const scoredItems = (candidates as any[]).map((post: any) => {
      const ageHours = (now.getTime() - new Date(post.created_at).getTime()) / (1000 * 60 * 60)
      const engagement = post.v_post_engagement_6h?.[0] || { likes6h: 0, comments6h: 0 }
      const tagOverlap = post.tags
        ? post.tags.filter((tag: string) => userInterests.includes(tag.toLowerCase())).length
        : 0
      const isFollowing = followeeIds.includes(post.author_id)

      const sRec = recencyScore(ageHours)
      const sEng = engagementScore(engagement.likes6h || 0, engagement.comments6h || 0)
      const sFol = isFollowing ? 1 : 0
      const sTag = tagScore(tagOverlap)

      return {
        ...post,
        ageHours,
        sRec,
        sEng,
        sFol,
        sTag,
        rawScore: RECO.wRecency * sRec + RECO.wEngagement * sEng + RECO.wFollow * sFol + RECO.wTags * sTag,
      }
    })

    // Normalize engagement scores
    const maxEngScore = Math.max(...scoredItems.map((item) => item.sEng), 1)
    scoredItems.forEach((item: any) => {
      item.sEngN = item.sEng / maxEngScore
      item.score =
        RECO.wRecency * item.sRec + RECO.wEngagement * item.sEngN + RECO.wFollow * item.sFol + RECO.wTags * item.sTag
    })

    // Sort by score and apply diversity constraints
    scoredItems.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.001) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      return b.score - a.score
    })

    // Apply maxPerAuthorPerPage constraint
    const authorCounts = new Map<string, number>()
    const diverseItems: any[] = []

    for (const item of scoredItems) {
      const authorCount = authorCounts.get(item.author_id) || 0
      if (authorCount < RECO.maxPerAuthorPerPage) {
        diverseItems.push(item)
        authorCounts.set(item.author_id, authorCount + 1)
        if (diverseItems.length >= limit) break
      }
    }

    // If not enough items and fallback enabled, add latest posts
    if (diverseItems.length < 5 && RECO.fallbackToLatest) {
      const { data: fallbackPosts } = await sb
        .from("posts")
        .select(`
          id, author_id, body, media_urls, tags, created_at, like_count, comment_count,
          profiles!posts_author_id_fkey(id, name, avatar_url)
        `)
        .eq("is_hidden", false)
        .neq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit - diverseItems.length)

      if (fallbackPosts) {
        const fallbackItems = (fallbackPosts as any[])
          .filter((post: any) => !diverseItems.some((item) => item.id === post.id))
          .map((post: any) => ({
            ...post,
            score: 0,
            sRec: 0,
            sEng: 0,
            sFol: 0,
            sTag: 0,
            source: "fallback" as const,
          }))

        diverseItems.push(...fallbackItems)
      }
    }

    // Format response
  const items = diverseItems.slice(0, limit).map((item: any) => ({
      id: item.id,
      author_id: item.author_id,
      body: item.body,
      media_urls: item.media_urls,
      tags: item.tags,
      created_at: item.created_at,
      like_count: item.like_count,
      comment_count: item.comment_count,
      author: item.profiles,
      explain: {
        sRec: Math.round(item.sRec * 1000) / 1000,
        sEng: Math.round((item.sEngN || item.sEng) * 1000) / 1000,
        sFol: item.sFol,
        sTag: Math.round(item.sTag * 1000) / 1000,
        score: Math.round(item.score * 1000) / 1000,
        source: item.source || "ranked",
      },
    }))

    const nextCursor = items.length === limit ? items[items.length - 1].created_at : null

    return Response.json({ items, nextCursor })
  } catch (error) {
    console.error("Reco API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
