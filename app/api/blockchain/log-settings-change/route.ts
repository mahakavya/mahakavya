import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const transactionHash = generateTransactionHash()
    const blockchainAddress = await getOrCreateBlockchainAddress(supabase, profile.id)

    // Create blockchain audit record
    await supabase.from("blockchain_audits").insert({
      user_id: profile.id,
      action: "settings_changed",
      blockchain_address: blockchainAddress,
      transaction_hash: transactionHash,
      integrity_check: true,
      audit_data: {
        timestamp: new Date().toISOString(),
        changeType: "settings_update",
        verificationHash: generateVerificationHash(profile.id),
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      transactionHash,
      blockchainAddress,
    })
  } catch (error) {
    console.error("Error logging blockchain settings change:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getOrCreateBlockchainAddress(supabase: any, userId: string): Promise<string> {
  // Check if user already has a blockchain address
  const { data: verification } = await supabase
    .from("blockchain_verifications")
    .select("blockchain_address")
    .eq("user_id", userId)
    .limit(1)
    .single()

  if (verification?.blockchain_address) {
    return verification.blockchain_address
  }

  // Generate new address
  const hash = Buffer.from(`${userId}_${Date.now()}`).toString("hex")
  return `0x${hash.substring(0, 40)}`
}

function generateTransactionHash(): string {
  const hash = Buffer.from(`tx_${Date.now()}_${Math.random()}`).toString("hex")
  return `0x${hash.substring(0, 64)}`
}

function generateVerificationHash(userId: string): string {
  const data = `${userId}_${Date.now()}`
  return Buffer.from(data).toString("hex")
}
