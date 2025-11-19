import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV, assertServerEnv } from "@/config/env"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QuerySchema = z.object({
  name: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
})

export async function GET(request: NextRequest) {
  try {
    assertServerEnv()

    const { searchParams } = new URL(request.url)
    const query = QuerySchema.parse({
      name: searchParams.get("name") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    })

    const supabase = createClient(ENV.SUPABASE_URL!, ENV.SERVICE_ROLE_KEY!)

    // Get current user and verify admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    // Build query
    let eventsQuery = supabase
      .from("events")
      .select(`
        id,
        name,
        props,
        created_at,
        profiles:user_id (
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(query.limit)

    if (query.name) {
      eventsQuery = eventsQuery.eq("name", query.name)
    }

    if (query.from) {
      eventsQuery = eventsQuery.gte("created_at", query.from)
    }

    if (query.to) {
      eventsQuery = eventsQuery.lte("created_at", query.to)
    }

    if (query.cursor) {
      eventsQuery = eventsQuery.lt("created_at", query.cursor)
    }

    const { data: events, error } = await eventsQuery

    if (error) {
      console.error("Failed to fetch events:", error)
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    const nextCursor = events && events.length === query.limit ? events[events.length - 1].created_at : null

    return NextResponse.json({
      items: events || [],
      nextCursor,
    })
  } catch (error) {
    console.error("Events API error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
