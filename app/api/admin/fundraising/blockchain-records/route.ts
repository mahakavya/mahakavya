import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const sb: any = supabase as any
    const { data, error } = await sb
      .from("blockchain_records")
      .select("*")
      .eq("content_type", "fundraising_campaign")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch blockchain records" }, { status: 500 })
    }

    const records =
      data?.map((record: any) => ({
        id: record.id,
        campaignId: record.content_id,
        transactionHash: record.transaction_hash,
        blockNumber: record.block_number,
        verificationStatus: record.verification_status,
        integrityHash: record.integrity_hash,
        timestamp: record.created_at,
      })) || []

    return NextResponse.json({ success: true, data: records })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
