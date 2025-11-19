import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { assertAdmin, logAudit } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PaymentsQuerySchema = z.object({
  status: z.enum(["captured", "failed", "refunded"]).optional(),
  kind: z.enum(["intro", "invoice", "donation", "draw"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
})

const RefundSchema = z.object({
  paymentId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(sb, user.id)

    const { searchParams } = new URL(request.url)
    const { status, kind, cursor, limit } = PaymentsQuerySchema.parse({
      status: searchParams.get("status"),
      kind: searchParams.get("kind"),
      cursor: searchParams.get("cursor"),
      limit: searchParams.get("limit"),
    })

    let query = sb
      .from("payments")
      .select(`
        *,
        profiles:user_id(name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit + 1)

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (kind) {
      query = query.contains("meta", { kind })
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching payments:", error)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    const hasMore = data.length > limit
    const items = hasMore ? data.slice(0, -1) : data
    const nextCursor = hasMore ? data[data.length - 2]?.created_at : null

    return NextResponse.json({ items, nextCursor })
  } catch (error) {
    console.error("Error in admin payments GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(sb, user.id)

    const body = await request.json()
    const { paymentId } = RefundSchema.parse(body)

    // Get the payment
    const { data: payment, error: paymentError } = await sb.from("payments").select("*").eq("id", paymentId).single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.status === "refunded") {
      return NextResponse.json({ error: "Payment already refunded" }, { status: 400 })
    }

    // Mock refund (in real implementation, call Razorpay Refunds API)
    const refundMeta = {
      ...payment.meta,
      refund_note: "Admin refund",
      refunded_at: new Date().toISOString(),
      refunded_by: user.id,
    }

    const { error: updateError } = await sb
      .from("payments")
      .update({
        status: "refunded",
        meta: refundMeta,
      })
      .eq("id", paymentId)

    if (updateError) {
      console.error("Error updating payment:", updateError)
      return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
    }

    // Log audit
    await logAudit(sb, user.id, "admin_refund", "payment", paymentId, {
      original_amount: payment.amount,
      original_status: payment.status,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin refund:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
