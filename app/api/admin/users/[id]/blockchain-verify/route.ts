import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { blockchainContentService } from "@/lib/blockchain-content-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    const userId = params.id

    // Get user data
    const { data: userData, error: userFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (userFetchError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Perform blockchain verification
    const verification = await blockchainContentService.verifyContent(
      userId,
      JSON.stringify({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        created_at: userData.created_at,
      }),
      userData.id,
    )

    if (verification.isVerified) {
      // Update user as blockchain verified
      await supabase
        .from("profiles")
        .update({
          blockchain_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      // Store blockchain record
      if (verification.blockchainRecord) {
        await supabase.from("blockchain_transactions").insert({
          transaction_hash: verification.blockchainRecord.transactionHash,
          transaction_type: "user_identity",
          status: "confirmed",
          block_number: verification.blockchainRecord.blockNumber,
          related_entity_id: userId,
          related_entity_type: "user",
          metadata: {
            verification_hash: verification.integrityHash,
            verification_timestamp: verification.verificationTimestamp,
          },
        })
      }

      return NextResponse.json({
        success: true,
        message: "User blockchain verification completed",
        data: {
          verification_hash: verification.integrityHash,
          transaction_hash: verification.blockchainRecord?.transactionHash,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Blockchain verification failed",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in blockchain verification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
