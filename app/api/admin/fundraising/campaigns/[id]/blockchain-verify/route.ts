import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id

    // Get campaign data
    const { data: campaign, error } = await supabase
      .from("fundraising_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 })
    }

    // Generate integrity hash
    const campaignData = {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      target_amount: campaign.target_amount,
      creator_id: campaign.creator_id,
      created_at: campaign.created_at,
    }

    const integrityHash = createHash("sha256").update(JSON.stringify(campaignData)).digest("hex")

    // Simulate blockchain transaction
    const transactionHash =
      "0x" +
      createHash("sha256")
        .update(Date.now().toString() + Math.random().toString())
        .digest("hex")

    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000

    // Save blockchain record
    await supabase.from("blockchain_records").insert({
      content_type: "fundraising_campaign",
      content_id: campaignId,
      transaction_hash: transactionHash,
      block_number: blockNumber,
      verification_status: "verified",
      integrity_hash: integrityHash,
    })

    // Update campaign as blockchain verified
    await supabase
      .from("fundraising_campaigns")
      .update({
        blockchain_verified: true,
        blockchain_hash: transactionHash,
      })
      .eq("id", campaignId)

    return NextResponse.json({
      success: true,
      transactionHash,
      blockNumber,
      integrityHash,
    })
  } catch (error) {
    console.error("Blockchain verification error:", error)
    return NextResponse.json({ success: false, error: "Blockchain verification failed" }, { status: 500 })
  }
}
