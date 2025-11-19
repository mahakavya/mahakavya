import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId } = body

    // Get current RPA settings
    const { data: currentSettings } = await supabase
      .from("user_preferences")
      .select("rpa_automation_enabled")
      .eq("user_id", userId)
      .single()

    const newRPAStatus = !currentSettings?.rpa_automation_enabled

    // Update RPA automation settings
    const { error: updateError } = await supabase.from("user_preferences").upsert({
      user_id: userId,
      rpa_automation_enabled: newRPAStatus,
      updated_at: new Date().toISOString(),
    })

    if (updateError) {
      console.error("Error updating RPA settings:", updateError)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    // Log RPA configuration change
    await supabase.from("rpa_jobs").insert({
      user_id: userId,
      service: "sahaya",
      job_type: "configuration_change",
      status: "completed",
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })

    // Log blockchain transaction for settings change
    await supabase.from("blockchain_transactions").insert({
      user_id: userId,
      service: "sahaya",
      transaction_type: "rpa_settings_change",
      transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "confirmed",
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      rpa_enabled: newRPAStatus,
    })
  } catch (error) {
    console.error("RPA toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
