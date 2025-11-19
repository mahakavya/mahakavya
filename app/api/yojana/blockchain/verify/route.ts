import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json()

    // Simulate blockchain verification process
    const verificationHash = crypto.createHash("sha256").update(`${user_id}-${Date.now()}`).digest("hex")

    // Mock blockchain verification (in real implementation, this would interact with actual blockchain)
    const verified = true
    const blockchainTxId = `0x${verificationHash.substring(0, 40)}`

    // Store verification result
    const supabase = await createSupabaseServerClient()
    await supabase
      .from("blockchain_verifications")
      .insert({
        user_id,
        verification_hash: verificationHash,
        transaction_id: blockchainTxId,
        verified,
        verified_at: new Date().toISOString(),
      })
      .catch(() => {}) // Ignore errors for mock implementation

    return NextResponse.json({
      verified,
      transaction_id: blockchainTxId,
      verification_hash: verificationHash,
    })
  } catch (error) {
    console.error("Blockchain verification API error:", error)
    return NextResponse.json(
      {
        verified: false,
        error: "Verification failed",
      },
      { status: 500 },
    )
  }
}
