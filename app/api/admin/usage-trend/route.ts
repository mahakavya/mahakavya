import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — ensure dynamic
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

    // Get days parameter
    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from("daily_usage")
      .select("usage_date, dau, posts, reels, messages")
      .gte("usage_date", startDate.toISOString().split("T")[0])
      .lte("usage_date", endDate.toISOString().split("T")[0])
      .order("usage_date", { ascending: true })

    if (error) {
      throw error
    }

    logger.info("Usage trend data fetched", ({
      userId: session.user.id,
      days,
      recordCount: data?.length || 0,
    } as any))

    return NextResponse.json(data || [])
  } catch (error) {
    logger.error("Failed to fetch usage trend", error as Error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
