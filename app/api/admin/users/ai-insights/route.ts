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

    // Get AI insights from the database
    const { data: insights, error } = await supabase
      .from("ai_insights")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching AI insights:", error)
      return NextResponse.json({ error: "Failed to fetch AI insights" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: insights || [],
    })
  } catch (error) {
    console.error("Error in admin AI insights GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
