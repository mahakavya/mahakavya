import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    // Get bulk actions from the database
    const { data: bulkActions, error } = await supabase
      .from("bulk_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching bulk actions:", error)
      return NextResponse.json({ error: "Failed to fetch bulk actions" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: bulkActions || [],
    })
  } catch (error) {
    console.error("Error in admin bulk actions GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
