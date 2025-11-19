import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get blockchain verification status
    const { data: verification, error: verificationError } = await supabase
      .from("blockchain_verifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Get latest audit record
    const { data: audit, error: auditError } = await supabase
      .from("blockchain_audits")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Determine verification level based on completed verifications
    let verificationLevel: "basic" | "enhanced" | "premium" = "basic"

    if (verification) {
      if (verification.identity_verified && verification.profile_verified && verification.content_verified) {
        verificationLevel = "premium"
      } else if (verification.identity_verified && verification.profile_verified) {
        verificationLevel = "enhanced"
      }
    }

    const status = {
      profileVerified: verification?.profile_verified || false,
      settingsIntegrity: audit?.integrity_check || false,
      lastAudit: audit?.created_at ? new Date(audit.created_at).toLocaleDateString() : "Never",
      verificationLevel,
      blockchainAddress: verification?.blockchain_address || null,
      transactionHash: verification?.transaction_hash || null,
      verificationScore: calculateVerificationScore(verification, audit),
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("Error fetching blockchain status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateVerificationScore(verification: any, audit: any) {
  let score = 0

  if (verification?.identity_verified) score += 30
  if (verification?.profile_verified) score += 25
  if (verification?.content_verified) score += 25
  if (audit?.integrity_check) score += 20

  return score
}
