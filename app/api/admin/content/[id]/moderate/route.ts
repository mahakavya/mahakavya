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
    const contentId = params.id

    if (!["approve", "reject", "flag"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update content status
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        status: action === "approve" ? "published" : action,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
      })
      .eq("id", contentId)

    if (updateError) {
      throw updateError
    }

    // Log the moderation action
    await supabase.from("moderation_logs").insert({
      content_id: contentId,
      moderator_id: user.id,
      action,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Content ${action}ed successfully`,
    })
  } catch (error) {
    console.error("Content moderation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
