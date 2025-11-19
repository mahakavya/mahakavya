import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { verifyWebhookSignature } from "@/lib/razorpay"
import { env, hasSupabaseConfig } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!hasSupabaseConfig()) {
      console.error("Webhook: Supabase not configured")
      return NextResponse.json({ error: "Service not configured" }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      console.error("Webhook: Missing signature")
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature)
    if (!isValid) {
      console.error("Webhook: Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    const { event: eventType, payload } = event

    console.log(`Webhook: Processing event ${eventType}`)

    // Use service role client for webhook operations
    const supabase = createClient(env.SUPABASE_URL, env.SERVICE_ROLE_KEY)

    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const { payment, order } = payload
        const orderId = payment?.order_id || order?.id

        if (!orderId) {
          console.warn("Webhook: No order ID found in payment event")
          break
        }

        // Update payment status
        const { data: paymentRecord, error: paymentError } = await supabase
          .from("payments")
          .update({
            payment_id: payment?.id,
            status: "captured",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId)
          .select("user_id, kind, meta")
          .single()

        if (paymentError || !paymentRecord) {
          console.error("Webhook: Failed to update payment:", paymentError)
          break
        }

        console.log(`Webhook: Updated payment for user ${paymentRecord.user_id}`)

        // Handle different payment types
        if (paymentRecord.kind === "intro") {
          // Grant intro access
          await supabase.from("feature_access").upsert(
            {
              user_id: paymentRecord.user_id,
              can_feed: true,
              can_reels: true,
              can_luckydraw: true,
              can_fundraising: true,
              can_emotional: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          )

          console.log(`Webhook: Granted intro access to user ${paymentRecord.user_id}`)
        }
        break
      }

      case "subscription.activated": {
        const { subscription } = payload

        if (!subscription?.id) {
          console.warn("Webhook: No subscription ID found in event")
          break
        }

        // Update subscription status
        const { error: subError } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: subscription.current_start
              ? new Date(subscription.current_start * 1000).toISOString()
              : undefined,
            current_period_end: subscription.current_end
              ? new Date(subscription.current_end * 1000).toISOString()
              : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id)

        if (subError) {
          console.error("Webhook: Failed to update subscription:", subError)
          break
        }

        // Get user ID from subscription
        const { data: subRecord } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("subscription_id", subscription.id)
          .single()

        if (subRecord) {
          // Grant full feature access for active subscription
          await supabase.from("feature_access").upsert(
            {
              user_id: subRecord.user_id,
              can_feed: true,
              can_reels: true,
              can_luckydraw: true,
              can_fundraising: true,
              can_emotional: true,
              can_messaging: true, // Premium feature
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            },
          )

          console.log(`Webhook: Activated subscription for user ${subRecord.user_id}`)
        }
        break
      }

      case "subscription.cancelled": {
        const { subscription } = payload

        if (!subscription?.id) break

        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("subscription_id", subscription.id)

        console.log(`Webhook: Cancelled subscription ${subscription.id}`)
        break
      }

      default:
        console.log(`Webhook: Unhandled event type ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook: Processing failed:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
