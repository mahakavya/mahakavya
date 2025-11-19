import { type NextRequest, NextResponse } from "next/server"
// Uses cookies and server auth helpers — force dynamic
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
      .from("audit_logs")
      .select(`
        *,
        actor:profiles!actor_id(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    logger.info("Audit logs fetched", ({
      userId: session.user.id,
      logCount: data?.length || 0,
    } as any))

    return NextResponse.json(data || [])
  } catch (error) {
    logger.error("Failed to fetch audit logs", error as Error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
