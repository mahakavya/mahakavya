import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 })
    }

    // Get blockchain verification records
    const { data: verifications } = await supabase
      .from("blockchain_transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("service", "sahaya")
      .order("created_at", { ascending: false })
      .limit(10)

    // Simulate blockchain network status
    const networkStatuses = ["active", "syncing", "offline"]
    const networkStatus = networkStatuses[0] // Always active for demo

    // Calculate verification score based on successful transactions
    const successfulVerifications = verifications?.filter((v) => v.status === "confirmed") || []
    const verificationScore =
      verifications?.length > 0 ? (successfulVerifications.length / verifications.length) * 100 : 95 // Default high score

    // Get total transactions count
    const { count: totalTransactions } = await supabase
      .from("blockchain_transactions")
      .select("*", { count: "exact", head: true })
      .eq("service", "sahaya")

    // Format recent verifications
    const recentVerifications = (verifications || []).slice(0, 5).map((v) => ({
      id: v.id,
      type: v.transaction_type || "Session Verification",
      timestamp: v.created_at,
      hash: v.transaction_hash || `0x${Math.random().toString(16).substr(2, 64)}`,
    }))

    // Simulate checking blockchain status
    const isVerified = Math.random() > 0.5 // Simulate verification status

    const blockchainStatus = {
      network_status: networkStatus,
      verification_score: Math.round(verificationScore),
      total_transactions: totalTransactions || 0,
      recent_verifications: recentVerifications,
      is_verified: isVerified,
    }

    return NextResponse.json(blockchainStatus)
  } catch (error) {
    console.error("Blockchain status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
