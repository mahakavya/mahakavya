import { type NextRequest, NextResponse } from "next/server"
// Uses server auth helpers and cookies — force dynamic
export const dynamic = 'force-dynamic'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import { logger } from "@/lib/log"

export async function GET(request: NextRequest) {
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

    // Get limit parameter
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const { data, error } = await supabase
      .from("moderation_flags")
      .select(`
        *,
        reporter:profiles!reporter_id(full_name, email)
      `)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    logger.info("Moderation queue fetched", {
      userId: session.user.id,
      flagCount: data?.length || 0,
    })

    return NextResponse.json(data || [])
  } catch (error) {
    logger.error("Failed to fetch moderation queue", error as Error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
