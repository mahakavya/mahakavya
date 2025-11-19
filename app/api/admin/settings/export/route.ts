import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get current user and verify admin access
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "admin" && profile?.role !== "master_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get current settings
    const { data: settings, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    // Get system status
    const { data: systemStatus } = await supabase.from("system_status").select("*")

    // Get templates
    const { data: templates } = await supabase.from("settings_templates").select("*")

    // Create export data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.id,
        version: "1.0",
        platform: "Mahakavya",
      },
      settings: settings?.settings || {},
      systemStatus: systemStatus || [],
      templates: templates || [],
      // Redact sensitive information
      redacted: ["ai.apiKey", "blockchain.privateKey", "notifications.webhookUrl", "notifications.slackWebhook"],
    }

    // Redact sensitive data
    if (exportData.settings.ai?.apiKey) {
      exportData.settings.ai.apiKey = "[REDACTED]"
    }
    if (exportData.settings.blockchain?.privateKey) {
      exportData.settings.blockchain.privateKey = "[REDACTED]"
    }
    if (exportData.settings.notifications?.webhookUrl) {
      exportData.settings.notifications.webhookUrl = "[REDACTED]"
    }
    if (exportData.settings.notifications?.slackWebhook) {
      exportData.settings.notifications.slackWebhook = "[REDACTED]"
    }

    // Log the export
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action: "export_settings",
      details: { exportedAt: exportData.metadata.exportedAt },
    })

    // Return as downloadable JSON
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="niyantrana-settings-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })

    return response
  } catch (error) {
    console.error("Settings export error:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
