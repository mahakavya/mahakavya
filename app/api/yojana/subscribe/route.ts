import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { razorpay } from "@/lib/razorpay"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { plan_id, blockchain_verified } = await request.json()

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Updated plan pricing (in paise) - New pricing structure
    const planPricing = {
      intro: 9900, // ₹99 one-time
      monthly: 9900, // ₹99/month (introductory offer for 1 year)
      annual: 118800, // ₹1188/year (₹99 × 12 months)
    }

    // Regular pricing after introductory period
    const regularPricing = {
      monthly: 49900, // ₹499/month (after 1 year)
      annual: 598800, // ₹5988/year (₹499 × 12 months)
    }

    const amount = planPricing[plan_id as keyof typeof planPricing]
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Check if user has already used introductory pricing
    const { data: existingSubscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("intro_used", true)

    const hasUsedIntroOffer = existingSubscriptions && existingSubscriptions.length > 0

    // Determine actual pricing
    let finalAmount = amount
    let isIntroOffer = false

    if ((plan_id === "monthly" || plan_id === "annual") && !hasUsedIntroOffer) {
      // User gets introductory pricing
      finalAmount = amount
      isIntroOffer = true
    } else if ((plan_id === "monthly" || plan_id === "annual") && hasUsedIntroOffer) {
      // User pays regular pricing
      finalAmount = regularPricing[plan_id as keyof typeof regularPricing] || amount
      isIntroOffer = false
    }

    // Create subscription record
    const subscriptionData = {
      user_id: user.id,
      plan_id,
      status: "pending",
      amount: finalAmount,
      blockchain_verified,
      intro_used: isIntroOffer,
      is_intro_offer: isIntroOffer,
      intro_period_end:
        isIntroOffer && plan_id === "monthly"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
          : null,
      created_at: new Date().toISOString(),
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert(subscriptionData)
      .select()
      .single()

    if (subError) throw subError

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount,
      currency: "INR",
      receipt: `sub_${subscription.id}`,
      notes: {
        subscription_id: subscription.id,
        plan_id,
        user_id: user.id,
        is_intro_offer: isIntroOffer.toString(),
        intro_period_end: subscriptionData.intro_period_end || "",
      },
    })

    // Update subscription with Razorpay order ID
    await supabase.from("subscriptions").update({ razorpay_order_id: razorpayOrder.id }).eq("id", subscription.id)

    // Create payment URL
    const paymentUrl = `/billing?order_id=${razorpayOrder.id}&subscription_id=${subscription.id}`

    return NextResponse.json({
      subscription_id: subscription.id,
      razorpay_order_id: razorpayOrder.id,
      payment_url: paymentUrl,
      amount: finalAmount,
      is_intro_offer: isIntroOffer,
      intro_period_end: subscriptionData.intro_period_end,
      regular_price_after_intro: isIntroOffer ? regularPricing[plan_id as keyof typeof regularPricing] : null,
    })
  } catch (error) {
    console.error("Subscription API error:", error)
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
