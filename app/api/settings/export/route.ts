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

    // Get all user data for export
    const [{ data: settings }, { data: posts }, { data: activities }, { data: preferences }] = await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", profile.id),
      supabase.from("posts").select("*").eq("user_id", profile.id),
      supabase.from("analytics_events").select("*").eq("user_id", profile.id),
      supabase.from("user_preferences").select("*").eq("user_id", profile.id),
    ])

    const exportData = {
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
      },
      settings: settings?.[0]?.settings || {},
      posts: posts || [],
      activities: activities || [],
      preferences: preferences || [],
      exportedAt: new Date().toISOString(),
      version: "1.0",
    }

    // Log the export action
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "data_exported",
      entity: "user_data",
      entity_id: profile.id,
      metadata: {
        recordCount: {
          posts: posts?.length || 0,
          activities: activities?.length || 0,
          preferences: preferences?.length || 0,
        },
      },
      created_at: new Date().toISOString(),
    })

    const jsonString = JSON.stringify(exportData, null, 2)
    const buffer = Buffer.from(jsonString, "utf-8")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mahakavya-data-${profile.id}-${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
