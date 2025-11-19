import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerActionClient } from "@/lib/supabase"
import crypto from "crypto"
import { RAZORPAY_CONFIG } from "@/config/payments"

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
    const { order_id, payment_id, signature } = body

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_CONFIG.keySecret)
      .update(`${order_id}|${payment_id}`)
      .digest("hex")

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Update payment record (client acknowledgment only)
    const { error: paymentError } = await supabase.from("payments").upsert({
      order_id,
      payment_id,
      signature,
      user_id: user.id,
      status: "client_verified",
      verified_at: new Date().toISOString(),
    })

    if (paymentError) {
      console.error("Error updating payment:", paymentError)
    }

    // Note: Actual subscription activation happens in webhook
    // This is just client-side acknowledgment
    return NextResponse.json({
      success: true,
      message: "Payment verification received. Processing...",
    })
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
