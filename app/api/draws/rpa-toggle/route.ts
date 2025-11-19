import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", profile.id)
      .single()

    if (subscription?.status !== "active") {
      return NextResponse.json({ error: "Premium subscription required" }, { status: 403 })
    }

    const body = await request.json()
    const { enabled } = body

    // Update user preferences
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: profile.id,
        rpa_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    )

    if (error) {
      console.error("Failed to update RPA settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    // Log the automation toggle
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: enabled ? "rpa_enabled" : "rpa_disabled",
      entity: "draws_automation",
      meta: { enabled },
    })

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error("RPA toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
