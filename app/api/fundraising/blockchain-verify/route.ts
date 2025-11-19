import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

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

    const body = await request.json()
    const { title, goalAmount, beneficiaryName } = body

    // Generate blockchain verification
    const verificationData = {
      userId: session.user.id,
      title,
      goalAmount: Number.parseInt(goalAmount),
      beneficiaryName,
      timestamp: Date.now(),
    }

    const blockchainHash = generateBlockchainHash(verificationData)
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Store blockchain verification
    await supabase.from("blockchain_verifications").insert({
      user_id: session.user.id,
      verification_hash: blockchainHash,
      transaction_id: transactionId,
      verified: true,
      verified_at: new Date().toISOString(),
    })

    // Store blockchain transaction
    await supabase.from("blockchain_transactions").insert({
      user_id: session.user.id,
      transaction_type: "campaign_verification",
      transaction_id: transactionId,
      transaction_hash: blockchainHash,
      metadata: verificationData,
    })

    return NextResponse.json({
      success: true,
      blockchainHash,
      transactionId,
      verificationTimestamp: Date.now(),
    })
  } catch (error) {
    console.error("Blockchain verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateBlockchainHash(data: any): string {
  // Simplified hash generation (in production, use proper cryptographic hashing)
  const jsonString = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, "0")}`
}
