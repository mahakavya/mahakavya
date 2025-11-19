import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()

    // Get blockchain verification stats
    const { data: verifiedCampaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("status", "live")
      .not("blockchain_hash", "is", null)

    const { data: totalTransactions } = await supabase
      .from("blockchain_transactions")
      .select("id", { count: "exact" })
      .eq("transaction_type", "campaign_verification")

    // Calculate security score based on verification rate
    const { data: allCampaigns } = await supabase
      .from("campaigns")
      .select("id", { count: "exact" })
      .eq("status", "live")

    const verificationRate = allCampaigns?.length ? (verifiedCampaigns?.length || 0) / allCampaigns.length : 0

    const securityScore = Math.round(verificationRate * 100)

    return NextResponse.json({
      verifiedCampaigns: verifiedCampaigns?.length || 0,
      totalTransactions: totalTransactions?.length || 0,
      securityScore,
    })
  } catch (error) {
    console.error("Blockchain stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
