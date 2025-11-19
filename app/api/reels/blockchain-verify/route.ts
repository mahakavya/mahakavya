import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { blockchainContentService } from "@/lib/blockchain-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reelId } = await request.json()

    if (!reelId) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 })
    }

    // Get the reel
    const { data: reel, error: reelError } = await supabase
      .from("reels")
      .select("*")
      .eq("id", reelId)
      .eq("author_id", user.id)
      .single()

    if (reelError || !reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 })
    }

    // Create content for blockchain verification
    const contentToVerify = JSON.stringify({
      id: reel.id,
      author_id: reel.author_id,
      video_url: reel.video_url,
      caption: reel.caption,
      created_at: reel.created_at,
      metadata: {
        views: reel.views,
        likes: reel.likes,
      },
    })

    // Perform blockchain verification
    const verification = await blockchainContentService.verifyContent(reel.id, contentToVerify, user.id)

    // Store blockchain verification record
    const { error: verificationError } = await supabase.from("blockchain_verifications").insert({
      entity_type: "reel",
      entity_id: reelId,
      verification_hash: verification.integrityHash,
      blockchain_tx_hash: verification.blockchainRecord?.transactionHash,
      block_number: verification.blockchainRecord?.blockNumber,
      verification_status: verification.isVerified ? "verified" : "failed",
      verification_data: {
        timestamp: verification.verificationTimestamp,
        content_hash: verification.integrityHash,
        network_status: "active",
      },
    })

    if (verificationError) {
      console.error("Failed to store blockchain verification:", verificationError)
      return NextResponse.json({ error: "Failed to store verification" }, { status: 500 })
    }

    // Update reel with blockchain status
    const { error: updateError } = await supabase
      .from("reels")
      .update({
        blockchain_verified: verification.isVerified,
        blockchain_hash: verification.integrityHash,
        blockchain_verified_at: new Date().toISOString(),
      })
      .eq("id", reelId)

    if (updateError) {
      console.error("Failed to update reel blockchain status:", updateError)
    }

    return NextResponse.json({
      success: true,
      verified: verification.isVerified,
      hash: verification.integrityHash,
      transaction: verification.blockchainRecord?.transactionHash,
      message: verification.isVerified ? "Reel verified on blockchain" : "Verification failed",
    })
  } catch (error) {
    console.error("Blockchain verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
