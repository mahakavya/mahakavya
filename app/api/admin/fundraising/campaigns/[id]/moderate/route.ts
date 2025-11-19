import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, reason } = await request.json()
    const campaignId = params.id

    if (!["approve", "reject", "flag"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Update campaign status
    const newStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "flagged"

    const { error: updateError } = await supabase
      .from("fundraising_campaigns")
      .update({
        status: newStatus,
        moderation_notes: reason,
        last_moderated_at: new Date().toISOString(),
        last_moderated_by: "admin", // In real app, get from auth
      })
      .eq("id", campaignId)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update campaign" }, { status: 500 })
    }

    // Log moderation action
    await supabase.from("moderation_actions").insert({
      content_type: "fundraising_campaign",
      content_id: campaignId,
      action: action,
      reason: reason,
      moderator_id: "admin", // In real app, get from auth
    })

    // Send notification to campaign creator if needed
    if (action === "reject" || action === "flag") {
      await supabase.from("notifications").insert({
        user_id: "creator_id", // Get from campaign
        type: "campaign_moderation",
        title: `Campaign ${action}ed`,
        message: reason || `Your campaign has been ${action}ed by our moderation team.`,
        data: { campaignId, action, reason },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
