import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { monitoring } from "@/lib/monitoring"
import { blockchainContentService } from "@/lib/blockchain-content-service"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/blockchain/verify-user-content", "POST", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId } = body

    // Get user's unverified posts
    const { data: unverifiedPosts } = await supabase
      .from("posts")
      .select("id, content, user_id, created_at")
      .eq("user_id", userId)
      .eq("blockchain_verified", false)
      .limit(10) // Verify up to 10 posts at a time

    if (!unverifiedPosts || unverifiedPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All your content is already verified",
        verifiedCount: 0,
      })
    }

    // Batch verify content using blockchain service
    const verificationPromises = unverifiedPosts.map(async (post) => {
      const verification = await blockchainContentService.verifyContent(post.id, post.content, post.user_id)

      // Update post verification status
      if (verification.isVerified) {
        await supabase
          .from("posts")
          .update({
            blockchain_verified: true,
            blockchain_hash: verification.integrityHash,
            verified_at: new Date().toISOString(),
          })
          .eq("id", post.id)

        // Store blockchain record
        await supabase.from("blockchain_records").insert({
          user_id: userId,
          content_id: post.id,
          content_type: "post",
          transaction_hash: verification.blockchainRecord?.transactionHash,
          block_number: verification.blockchainRecord?.blockNumber,
          integrity_hash: verification.integrityHash,
          verification_status: "verified",
          transaction_type: "content_verification",
        })
      }

      return verification
    })

    const verificationResults = await Promise.all(verificationPromises)
    const successfulVerifications = verificationResults.filter((result) => result.isVerified)

    // Log verification activity
    await supabase.from("user_activity_logs").insert({
      user_id: userId,
      action: "content_verified",
      details: {
        totalPosts: unverifiedPosts.length,
        verifiedPosts: successfulVerifications.length,
        verificationMethod: "blockchain",
      },
    })

    const response = {
      success: true,
      message: `Successfully verified ${successfulVerifications.length} of ${unverifiedPosts.length} posts`,
      verifiedCount: successfulVerifications.length,
      totalProcessed: unverifiedPosts.length,
      verificationDetails: verificationResults.map((result) => ({
        isVerified: result.isVerified,
        integrityHash: result.integrityHash,
        timestamp: result.verificationTimestamp,
      })),
    }

    monitoring.logApiCall("/api/blockchain/verify-user-content", "POST", Date.now() - startTime, 200, session.user.id)
    monitoring.logUserAction(
      "blockchain_content_verified",
      {
        verifiedCount: successfulVerifications.length,
        totalProcessed: unverifiedPosts.length,
      },
      session.user.id,
    )

    return NextResponse.json(response)
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/blockchain/verify-user-content" })
    monitoring.logApiCall("/api/blockchain/verify-user-content", "POST", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
