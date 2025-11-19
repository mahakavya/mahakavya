import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { logAdminAction } from "@/lib/audit"
import { logger } from "@/lib/log"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Verify admin access
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profile || !["ADMIN", "SUPER_ADMIN", "MASTER_ADMIN"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { status } = await request.json()

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Update the moderation flag
    const { data, error } = await supabase
      .from("moderation_flags")
      .update({
        status,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log the admin action
    await logAdminAction(session.user.id, "moderation_resolve", `flag_${params.id}`, {
      status,
      content_type: data.content_type,
      reason: data.reason,
    })

    logger.info("Moderation flag resolved", {
      userId: session.user.id,
      flagId: params.id,
      status,
    })

    return NextResponse.json(data)
  } catch (error) {
    logger.error("Failed to resolve moderation flag", error as Error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
