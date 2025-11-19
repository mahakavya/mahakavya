import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)
    const cursor = searchParams.get("cursor")
    const status = searchParams.get("status") || "upcoming"
    const search = searchParams.get("search")

    let query = supabase
      .from("draws")
      .select(`
        id,
        title,
        description,
        draw_at,
        ticket_price,
        max_entries,
        status,
        result,
        created_at,
        entries:draw_entries(count)
      `)
      .limit(limit)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    // Order by draw_at for upcoming, created_at for others
    if (status === "upcoming") {
      query = query.order("draw_at", { ascending: true })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    if (cursor) {
      if (status === "upcoming") {
        query = query.gt("draw_at", cursor)
      } else {
        query = query.lt("created_at", cursor)
      }
    }

    const { data: draws, error } = await query

    if (error) {
      console.error("Error fetching draws:", error)
      return NextResponse.json({ error: "Failed to fetch draws" }, { status: 500 })
    }

    const drawsWithEntries =
      draws?.map((draw) => ({
        ...draw,
        entries_count: draw.entries?.[0]?.count || 0,
        entries: undefined,
      })) || []

    const nextCursor =
      draws && draws.length === limit
        ? status === "upcoming"
          ? draws[draws.length - 1].draw_at
          : draws[draws.length - 1].created_at
        : null
    const hasMore = draws ? draws.length === limit : false

    return NextResponse.json({
      items: drawsWithEntries,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("Draws API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, draw_at, ticket_price, max_entries } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!draw_at) {
      return NextResponse.json({ error: "Draw date is required" }, { status: 400 })
    }

    const drawDate = new Date(draw_at)
    if (drawDate <= new Date()) {
      return NextResponse.json({ error: "Draw date must be in the future" }, { status: 400 })
    }

    const { data: draw, error } = await supabase
      .from("draws")
      .insert({
        title: title.trim(),
        description: description?.trim(),
        draw_at: drawDate.toISOString(),
        ticket_price: ticket_price || 0,
        max_entries,
        status: "upcoming",
      })
      .select(`
        id,
        title,
        description,
        draw_at,
        ticket_price,
        max_entries,
        status,
        result,
        created_at
      `)
      .single()

    if (error) {
      console.error("Error creating draw:", error)
      return NextResponse.json({ error: "Failed to create draw" }, { status: 500 })
    }

    const drawWithEntries = {
      ...draw,
      entries_count: 0,
    }

    return NextResponse.json(drawWithEntries, { status: 201 })
  } catch (error) {
    console.error("Create draw error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
