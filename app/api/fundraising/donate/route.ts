import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { DonationCreateSchema } from "@/lib/validators"
import { assertServerEnv } from "@/config/env"
import { createRazorpayOrder } from "@/lib/razorpay"
import { assertWithinLimit, getClientIp } from "@/lib/rate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Apply rate limiting
    try {
      await assertWithinLimit({
        sb: supabase,
        route: "/api/fundraising/donate",
        windowMs: 60_000, // 1 minute
        max: 5, // 5 donations per minute
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

    // Check if user has intro used or active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("intro_used, status")
      .eq("user_id", session.user.id)
      .single()

    if (!subscription || (!subscription.intro_used && subscription.status !== "active")) {
      return NextResponse.json({ error: "Payment access required" }, { status: 403 })
    }

    const body = await request.json()
  const input = DonationCreateSchema.parse(body)

  // Support optional clientTxnId in the body, generate if missing
  const clientTxnId = (body as any).clientTxnId ?? `ct_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  // Verify campaign exists and is live
  const { data: campaign } = await supabase.from("campaigns").select("id, status").eq("id", input.campaign_id).single()

    if (!campaign || campaign.status !== "live") {
      return NextResponse.json({ error: "Campaign not found or not accepting donations" }, { status: 404 })
    }

    // Create Razorpay order
    const orderData = {
      amount: input.amount * 100, // Convert to paise
      currency: "INR",
      receipt: `don_${clientTxnId}`,
      notes: {
        kind: "donation",
        campaignId: input.campaign_id,
        clientTxnId: clientTxnId,
      },
    }

    const razorpayOrder = await createRazorpayOrder(orderData)

    // Insert payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: session.user.id,
      order_id: razorpayOrder.id,
      amount: input.amount,
      currency: "INR",
      status: "created",
      kind: "donation",
        meta: {
          kind: "donation",
          campaignId: input.campaign_id,
          clientTxnId: clientTxnId,
        },
    })

    if (paymentError) {
      console.error("Failed to create payment record:", paymentError)
      return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
    }

    // Insert donation record
    const { error: donationError } = await supabase.from("donations").insert({
      campaign_id: input.campaign_id,
      user_id: session.user.id,
      amount: input.amount,
      status: "created",
      order_id: razorpayOrder.id,
    })

    if (donationError) {
      console.error("Failed to create donation record:", donationError)
      return NextResponse.json({ error: "Failed to create donation" }, { status: 500 })
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: input.amount,
      currency: "INR",
    })
  } catch (error) {
    console.error("Donation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
