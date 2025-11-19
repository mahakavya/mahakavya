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

    // Get all unverified campaigns
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, owner_id, goal_amount, created_at")
      .eq("status", "live")
      .is("blockchain_hash", null)

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All campaigns are already verified",
        verifiedCount: 0,
      })
    }

    let verifiedCount = 0

    // Process each campaign for blockchain verification
    for (const campaign of campaigns) {
      try {
        // Generate blockchain hash (simplified)
        const blockchainData = {
          campaignId: campaign.id,
          title: campaign.title,
          ownerId: campaign.owner_id,
          goalAmount: campaign.goal_amount,
          timestamp: Date.now(),
        }

        const blockchainHash = generateBlockchainHash(blockchainData)
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

        // Update campaign with blockchain hash
        await supabase.from("campaigns").update({ blockchain_hash: blockchainHash }).eq("id", campaign.id)

        // Record blockchain transaction
        await supabase.from("blockchain_transactions").insert({
          user_id: campaign.owner_id,
          transaction_type: "campaign_verification",
          transaction_id: transactionId,
          transaction_hash: blockchainHash,
          metadata: {
            campaignId: campaign.id,
            verificationTimestamp: Date.now(),
          },
        })

        // Record blockchain verification
        await supabase.from("blockchain_verifications").insert({
          user_id: campaign.owner_id,
          verification_hash: blockchainHash,
          transaction_id: transactionId,
          verified: true,
          verified_at: new Date().toISOString(),
        })

        verifiedCount++
      } catch (error) {
        console.error(`Failed to verify campaign ${campaign.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      verifiedCount,
      totalCampaigns: campaigns.length,
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
