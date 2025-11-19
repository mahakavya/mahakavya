import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { createSubscription } from "@/lib/razorpay"
import { PLAN_ID_MONTHLY } from "@/config/payments"
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

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (existingSubscription?.subscription_id) {
      return NextResponse.json({
        subscriptionId: existingSubscription.subscription_id,
      })
    }

    // Create Razorpay subscription
    const subscription = await createSubscription(PLAN_ID_MONTHLY, undefined, {
      kind: "subscription",
      user_id: user.id,
    })

    // Store subscription record in database
    const { error: subscriptionError } = await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_id: PLAN_ID_MONTHLY,
        subscription_id: subscription.id,
        status: "created", // Will be updated to active via webhook
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (subscriptionError) {
      console.error("Failed to store subscription record:", subscriptionError)
      return NextResponse.json({ error: "Failed to create subscription record" }, { status: 500 })
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("Subscription creation failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
