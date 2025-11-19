import { NextResponse } from "next/server"
import { getRazorpayPublicKey } from "@/config/env"

export async function GET() {
  try {
    const keyId = getRazorpayPublicKey()

    if (!keyId) {
      return NextResponse.json({ error: "Razorpay not configured" }, { status: 404 })
    }

    // Only return the public key ID, never the secret
    return NextResponse.json({
      keyId,
      configured: true,
    })
  } catch (error) {
    console.error("Error fetching Razorpay config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
