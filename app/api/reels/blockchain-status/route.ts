import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
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

    // Get blockchain verification stats for user's reels
    const { data: verifications, error: verificationsError } = await supabase
      .from("blockchain_verifications")
      .select(`
        id,
        entity_id,
        verification_status,
        blockchain_tx_hash,
        block_number,
        created_at,
        verified_at
      `)
      .eq("entity_type", "reel")
      .in("entity_id", supabase.from("reels").select("id").eq("author_id", user.id))

    if (verificationsError) {
      console.error("Failed to fetch verifications:", verificationsError)
    }

    const verifiedReels = verifications?.filter((v) => v.verification_status === "verified").length || 0
    const pendingVerifications = verifications?.filter((v) => v.verification_status === "pending").length || 0

    // Simulate blockchain network status
    const networkHealth = Math.random() > 0.1 ? "healthy" : Math.random() > 0.5 ? "degraded" : "offline"
    const gasPrice = Math.floor(Math.random() * 50) + 20 // 20-70 gwei
    const transactionCount = Math.floor(Math.random() * 1000) + 500

    // Get last block time (simulated)
    const lastBlockTime = new Date(Date.now() - Math.random() * 60000).toISOString()

    const status = {
      networkHealth,
      verifiedReels,
      pendingVerifications,
      lastBlockTime,
      gasPrice,
      transactionCount,
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Blockchain status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
