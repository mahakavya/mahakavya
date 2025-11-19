import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { getRazorpay } from "@/lib/razorpay"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Validate server environment
    assertServerEnv()

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
    const { cancelAtCycleEnd = true } = body

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single()

    if (subError || !subscription?.subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 })
    }

    const razorpay = getRazorpay()

    // Cancel subscription in Razorpay
    await razorpay.subscriptions.cancel(subscription.subscription_id, {
      cancel_at_cycle_end: cancelAtCycleEnd,
    })

    // Update subscription status
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id)

    if (updateError) {
      console.error("Failed to update subscription:", updateError)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Subscription cancellation failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
