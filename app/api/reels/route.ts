import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ReelCreateSchema, ReelsQuerySchema } from "@/lib/validators"
import { buildPaginatedResponse, parseCursor } from "@/lib/pagination"
import { assertServerEnv } from "@/config/env"
import { scoreContent, actionForScore, createSafetyFlag } from "@/lib/safety"
import { assertWithinLimit, getClientIp } from "@/lib/rate"
import { isShadowMuted, hideIfShadowMuted } from "@/lib/abuse"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    // Apply rate limiting
    try {
      await assertWithinLimit({
        sb: supabase,
        route: "/api/reels",
        windowMs: 600_000, // 10 minutes
        max: 5, // 5 reels per 10 minutes
        userId: user.id,
        ip: getClientIp(request),
      })
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { "Retry-After": String(e.retryAfter ?? 600), "content-type": "application/json" },
        })
      }
      throw e
    }

    const body = await request.json()
    const validatedData = ReelCreateSchema.parse(body)

    // Check if user is shadow-muted
    const muted = await isShadowMuted(supabase, user.id)

    // Add safety check for caption
    let isHidden = false
    let reasons: string[] = []
    let score = 0
    if (validatedData.caption) {
      const { score: contentScore, reasons: contentReasons } = scoreContent(validatedData.caption)
      const action = actionForScore(contentScore)

      score = contentScore
      reasons = contentReasons

      if (action === "autohide" || muted) {
        isHidden = true
      }
    } else if (muted) {
      isHidden = true
    }

    // Create reel with potential hiding and shadow-mute consideration
    const reelData = hideIfShadowMuted(muted, {
      author_id: user.id,
      video_url: validatedData.videoUrl,
      thumb_url: validatedData.thumbUrl,
      caption: validatedData.caption,
      is_hidden: isHidden,
    })

    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .insert(reelData)
      .select(
        `
        id,
        video_url,
        thumb_url,
        caption,
        views,
        likes,
        created_at,
        is_hidden,
        profiles:author_id (
          id,
          name,
          avatar_url
        )
      `,
      )
      .single()

    if (reelError) {
      console.error("Failed to create reel:", reelError)
      return NextResponse.json({ error: "Failed to create reel" }, { status: 500 })
    }

    // Create safety flag if needed (but not for shadow-muted users)
    try {
      if (
        !muted &&
        validatedData.caption &&
        (actionForScore(score) === "autohide" || actionForScore(score) === "flag")
      ) {
        await createSafetyFlag(supabase, "reel", reel.id, reasons[0] || "automated", score)
      }
    } catch (error) {
      console.error("Failed to create safety flag:", error)
      // Don't block reel creation if flag creation fails
    }

    return NextResponse.json({
      reel: {
        ...reel,
        author: reel.profiles,
        profiles: undefined,
      },
      moderated: isHidden,
    })
  } catch (error) {
    console.error("Reel creation error:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const queryData = ReelsQuerySchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || "15",
    })

    let query = supabase
      .from("reels")
      .select(
        `
        id,
        video_url,
        thumb_url,
        caption,
        views,
        likes,
        created_at,
        is_hidden,
        profiles:author_id (
          id,
          name,
          avatar_url
        ),
        reel_likes!left (
          user_id
        )
      `,
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(Number(queryData.limit) + 1) // +1 to check if there are more

    // Hide shadow-muted content from other users (but show to the author)
    query = query.or(`is_hidden.eq.false,author_id.eq.${user.id}`)

    // Apply cursor pagination
    if (queryData.cursor) {
      const cursorData = parseCursor(queryData.cursor)
      if (cursorData) {
        query = query.or(
          `created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`,
        )
      }
    }

    const { data: reels, error: reelsError } = await query

    if (reelsError) {
      console.error("Failed to fetch reels:", reelsError)
      return NextResponse.json({ error: "Failed to fetch reels" }, { status: 500 })
    }

    // Transform reels to include viewer like status
    const transformedReels = (reels || []).map((reel) => ({
      ...reel,
      author: reel.profiles,
      viewerLike: reel.reel_likes?.some((like: any) => like.user_id === user.id) || false,
      profiles: undefined, // Remove the nested profiles
      reel_likes: undefined, // Remove the nested reel_likes
    }))

    const paginatedResponse = buildPaginatedResponse(transformedReels, Number(queryData.limit))

    return NextResponse.json(paginatedResponse)
  } catch (error) {
    console.error("Reels fetch error:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
