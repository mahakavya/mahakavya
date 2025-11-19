import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { createOrder } from "@/lib/razorpay"
import { INTRO_PRICE, CURRENCY } from "@/config/payments"
import { hasRazorpayConfig } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay is configured
    if (!hasRazorpayConfig()) {
      return NextResponse.json({ error: "Payment processing is not configured" }, { status: 503 })
    }

    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientTxnId, kind } = body

    if (!clientTxnId || !kind) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate payment kind
    if (kind !== "intro") {
      return NextResponse.json({ error: "Invalid payment kind" }, { status: 400 })
    }

    // Check if user already has intro access
    const { data: existingAccess } = await supabase
      .from("feature_access")
      .select("can_feed")
      .eq("user_id", user.id)
      .single()

    if (existingAccess?.can_feed) {
      return NextResponse.json({ error: "Intro access already purchased" }, { status: 400 })
    }

    // Create Razorpay order
    const order = await createOrder(INTRO_PRICE, CURRENCY, `intro_${clientTxnId}`, {
      kind: "intro",
      user_id: user.id,
      client_txn_id: clientTxnId,
    })

    // Store payment record in database
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: order.id,
      amount: INTRO_PRICE,
      currency: CURRENCY,
      status: "created",
      kind: "intro",
      meta: {
        client_txn_id: clientTxnId,
        receipt: order.receipt,
      },
    })

    if (paymentError) {
      console.error("Failed to store payment record:", paymentError)
      return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 })
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    })
  } catch (error) {
    console.error("Order creation failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
