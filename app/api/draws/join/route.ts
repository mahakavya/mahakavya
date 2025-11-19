import { type NextRequest, NextResponse } from "next/server"
import { ENV, assertServerEnv } from "@/config/env"
import { DrawJoinSchema } from "@/lib/validators"
import { createSupabaseServerClient } from "@/lib/supabase"
import { createRazorpayOrder } from "@/lib/razorpay"
import { assertWithinLimit, getClientIp } from "@/lib/rate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Apply rate limiting
    try {
      await assertWithinLimit({
        sb: supabase,
        route: "/api/draws/join",
        windowMs: 60_000, // 1 minute
        max: 5, // 5 draw joins per minute
        userId: session.user.id,
        ip: getClientIp(request),
      })
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { "Retry-After": String(e.retryAfter ?? 60), "content-type": "application/json" },
        })
      }
      throw e
    }

  const body = await request.json()
  const data = DrawJoinSchema.parse(body) as any

    // Check user access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_luckydraw")
      .eq("user_id", session.user.id)
      .single()

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("intro_used, status")
      .eq("user_id", session.user.id)
      .single()

    const hasAccess = access?.can_luckydraw || subscription?.intro_used || subscription?.status === "active"

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied. Please purchase intro access or subscribe." }, { status: 403 })
    }

    // Fetch draw details
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("id, title, draw_at, status, ticket_price")
  .eq("id", data.draw_id)
      .single()

    if (drawError || !draw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 })
    }

    if (draw.status !== "upcoming") {
      return NextResponse.json({ error: "Draw is not accepting entries" }, { status: 400 })
    }

    if (new Date() >= new Date(draw.draw_at)) {
      return NextResponse.json({ error: "Draw has already started" }, { status: 400 })
    }

    // Check if user already entered
    const { data: existingEntry } = await supabase
      .from("entries")
      .select("id")
  .eq("draw_id", data.draw_id)
      .eq("user_id", session.user.id)
      .single()

    if (existingEntry) {
      return NextResponse.json({ error: "You have already entered this draw" }, { status: 400 })
    }

    // Handle free entry
    if (draw.ticket_price === 0) {
      const { error: entryError } = await supabase.from("entries").insert({
  draw_id: data.draw_id,
        user_id: session.user.id,
      })

      if (entryError) {
        console.error("Failed to create entry:", entryError)
        return NextResponse.json({ error: "Failed to join draw" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Handle paid entry
  if (!data.client_txn_id) {
      return NextResponse.json({ error: "Transaction ID required for paid draws" }, { status: 400 })
    }

    try {
      const order = await createRazorpayOrder({
        amount: draw.ticket_price * 100, // Convert to paise
        currency: "INR",
        receipt: `draw_${data.client_txn_id}`,
        notes: {
          kind: "draw",
          drawId: data.draw_id,
          userId: session.user.id,
        },
      })

      // Store payment record
      await supabase.from("payments").insert({
        user_id: session.user.id,
        order_id: order.id,
        amount: draw.ticket_price,
        currency: "INR",
        status: "created",
        kind: "draw",
        meta: {
          kind: "draw",
          drawId: data.draw_id,
          clientTxnId: data.client_txn_id,
          amount: draw.ticket_price,
        },
      })

      return NextResponse.json({
        orderId: order.id,
        amount: draw.ticket_price,
        currency: "INR",
      })
    } catch (error) {
      console.error("Failed to create Razorpay order:", error)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }
  } catch (error) {
    console.error("Join draw error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
