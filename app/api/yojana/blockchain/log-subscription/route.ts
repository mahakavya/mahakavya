import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { user_id, subscription_id, plan_id, timestamp } = await request.json()

    // Create blockchain transaction hash
    const transactionData = `${user_id}-${subscription_id}-${plan_id}-${timestamp}`
    const blockchainHash = crypto.createHash("sha256").update(transactionData).digest("hex")

    const blockchainTxId = `0x${blockchainHash.substring(0, 40)}`

    // Store blockchain transaction log
    const supabase = await createSupabaseServerClient()
    await supabase
      .from("blockchain_transactions")
      .insert({
        user_id,
        transaction_type: "subscription_created",
        transaction_id: blockchainTxId,
        transaction_hash: blockchainHash,
        metadata: {
          subscription_id,
          plan_id,
          timestamp,
        },
        created_at: new Date().toISOString(),
      })
      .catch(() => {}) // Ignore errors for mock implementation

    return NextResponse.json({
      success: true,
      transaction_id: blockchainTxId,
      blockchain_hash: blockchainHash,
    })
  } catch (error) {
    console.error("Blockchain logging API error:", error)
    return NextResponse.json({ error: "Logging failed" }, { status: 500 })
  }
}
