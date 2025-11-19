import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerActionClient } from "@/lib/supabase"
import Razorpay from "razorpay"
import { RAZORPAY_CONFIG, getPlanById } from "@/config/payments"

const razorpay = new Razorpay({
  key_id: RAZORPAY_CONFIG.keyId,
  key_secret: RAZORPAY_CONFIG.keySecret,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerActionClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id } = body

    // Validate plan
    const plan = getPlanById(plan_id)
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    // Create Razorpay order
    const orderOptions = {
      amount: plan.price, // Amount in paise
      currency: plan.currency,
      receipt: `order_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name,
      },
    }

    const order = await razorpay.orders.create(orderOptions)

    // Store order in database
    const { error: orderError } = await supabase.from("payment_orders").insert({
      id: order.id,
      user_id: user.id,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      plan_id: plan.id,
      receipt: order.receipt,
      created_at: new Date().toISOString(),
    })

    if (orderError) {
      console.error("Error storing order:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_CONFIG.keyId,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
