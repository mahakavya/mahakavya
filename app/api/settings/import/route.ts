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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileContent = await file.text()
    let importData

    try {
      importData = JSON.parse(fileContent)
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 })
    }

    // Validate import data structure
    if (!importData.settings || !importData.version) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Import settings
    if (importData.settings) {
      await supabase.from("user_settings").upsert({
        user_id: profile.id,
        settings: importData.settings,
        updated_at: new Date().toISOString(),
      })
    }

    // Log the import action
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "data_imported",
      entity: "user_settings",
      entity_id: profile.id,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        importVersion: importData.version,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error importing data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
