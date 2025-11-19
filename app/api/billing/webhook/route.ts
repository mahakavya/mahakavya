import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerActionClient } from "@/lib/supabase"
import crypto from "crypto"
import { RAZORPAY_CONFIG, getPlanById } from "@/config/payments"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const expectedSignature = crypto.createHmac("sha256", RAZORPAY_CONFIG.webhookSecret).update(body).digest("hex")

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("Webhook event:", event.event)

    const supabase = await createSupabaseServerActionClient()

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity
      const order = event.payload.order?.entity

      // Get order details from database
      const { data: orderData, error: orderError } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("id", payment.order_id)
        .single()

      if (orderError || !orderData) {
        console.error("Order not found:", payment.order_id)
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // Get plan details
      const plan = getPlanById(orderData.plan_id)
      if (!plan) {
        console.error("Plan not found:", orderData.plan_id)
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }

      // Calculate subscription period
      const now = new Date()
      const periodEnd = new Date(now)

      if (plan.interval === "month") {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (plan.interval === "year") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      } else if (plan.interval === "one-time") {
        // For one-time payments, set a long period (e.g., 10 years)
        periodEnd.setFullYear(periodEnd.getFullYear() + 10)
      }

      // Store payment record
      const { error: paymentError } = await supabase.from("payments").upsert({
        id: payment.id,
        user_id: orderData.user_id,
        order_id: payment.order_id,
        payment_id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: "captured",
        provider: "razorpay",
        method: payment.method,
        created_at: new Date(payment.created_at * 1000).toISOString(),
      })

      if (paymentError) {
        console.error("Error storing payment:", paymentError)
      }

      // Activate subscription
      const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
        user_id: orderData.user_id,
        status: "active",
        plan_id: plan.id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })

      if (subscriptionError) {
        console.error("Error activating subscription:", subscriptionError)
        return NextResponse.json({ error: "Failed to activate subscription" }, { status: 500 })
      }

      console.log(`Subscription activated for user ${orderData.user_id}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
