import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { action } = await request.json()
    const userId = params.id

    if (!["suspend", "ban", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const status = action === "activate" ? "active" : action === "suspend" ? "suspended" : "banned"

    // Update user status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      throw updateError
    }

    // Log the user action
    await supabase.from("user_actions").insert({
      user_id: userId,
      admin_id: user.id,
      action,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
    })
  } catch (error) {
    console.error("User action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
