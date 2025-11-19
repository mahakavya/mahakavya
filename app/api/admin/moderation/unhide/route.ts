import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { assertAdmin, logAudit } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UnhideSchema = z.object({
  entityType: z.enum(["post", "reel", "comment"]),
  entityId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(sb, user.id)

    const body = await request.json()
    const { entityType, entityId } = UnhideSchema.parse(body)

    // Determine table name
    const table = entityType === "post" ? "posts" : entityType === "reel" ? "reels" : "post_comments"

    // Unhide the content
    const { error } = await sb.from(table).update({ is_hidden: false }).eq("id", entityId)

    if (error) {
      console.error("Error unhiding content:", error)
      return NextResponse.json({ error: "Failed to unhide content" }, { status: 500 })
    }

    // Log audit
    await logAudit(sb, user.id, "admin_unhide", entityType, entityId, {
      action: "unhide",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin unhide:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
