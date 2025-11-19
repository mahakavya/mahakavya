import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user owns the campaign
    const { data: campaign } = await supabase.from("campaigns").select("owner_id, status").eq("id", params.id).single()

    if (!campaign || campaign.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Campaign not found or access denied" }, { status: 404 })
    }

    if (campaign.status === "live") {
      return NextResponse.json({ error: "Campaign is already live" }, { status: 400 })
    }

    // Publish the campaign
    const { data: updatedCampaign, error } = await supabase
      .from("campaigns")
      .update({ status: "live" })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Failed to publish campaign:", error)
      return NextResponse.json({ error: "Failed to publish campaign" }, { status: 500 })
    }

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("Publish campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
