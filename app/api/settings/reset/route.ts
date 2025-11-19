import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete existing settings
    const { error: deleteError } = await supabase.from("user_settings").delete().eq("user_id", profile.id)

    if (deleteError) {
      console.error("Error deleting settings:", deleteError)
      return NextResponse.json({ error: "Failed to reset settings" }, { status: 500 })
    }

    // Log the reset action
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "settings_reset",
      entity: "user_settings",
      entity_id: profile.id,
      metadata: { reason: "user_requested" },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
