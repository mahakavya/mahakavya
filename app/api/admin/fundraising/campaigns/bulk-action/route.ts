import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { campaignIds, action, reason } = await request.json()

    if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid campaign IDs" }, { status: 400 })
    }

    if (!["approve", "reject", "flag", "delete"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    let processed = 0
    let failed = 0
    const errors: string[] = []

    for (const campaignId of campaignIds) {
      try {
        if (action === "delete") {
          const { error } = await supabase.from("fundraising_campaigns").delete().eq("id", campaignId)

          if (error) throw error
        } else {
          const newStatus = action === "approve" ? "active" : action === "reject" ? "rejected" : "flagged"

          const { error } = await supabase
            .from("fundraising_campaigns")
            .update({
              status: newStatus,
              moderation_notes: reason,
              last_moderated_at: new Date().toISOString(),
              last_moderated_by: "admin", // In real app, get from auth
            })
            .eq("id", campaignId)

          if (error) throw error

          // Log moderation action
          await supabase.from("moderation_actions").insert({
            content_type: "fundraising_campaign",
            content_id: campaignId,
            action: action,
            reason: reason,
            moderator_id: "admin", // In real app, get from auth
          })
        }

        processed++
      } catch (error) {
        console.error(`Failed to process campaign ${campaignId}:`, error)
        failed++
        errors.push(`Campaign ${campaignId}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: campaignIds.length,
      errors: failed > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
