import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV, assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()
    const supabase = createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_ANON_KEY!)

    const { data: draw, error } = await supabase
      .from("draws")
      .select(`
        id,
        title,
        draw_at,
        status,
        ticket_price,
        result,
        created_at,
        entries:entries(count)
      `)
      .eq("id", params.id)
      .single()

    if (error || !draw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 })
    }

    // Transform data
    const transformedDraw = {
      id: draw.id,
      title: draw.title,
      draw_at: draw.draw_at,
      status: draw.status,
      ticket_price: draw.ticket_price,
      result: draw.result,
      entries_count: draw.entries?.[0]?.count || 0,
    }

    return NextResponse.json(transformedDraw)
  } catch (error) {
    console.error("Get draw error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
