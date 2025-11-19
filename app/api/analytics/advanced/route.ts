import { type NextRequest, NextResponse } from "next/server"
import { advancedAnalyticsService } from "@/lib/advanced-analytics"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"
import { isAdmin } from "@/lib/auth/requireAdmin"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile || !isAdmin(profile)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const end = searchParams.get("end") || new Date().toISOString()

    const dashboard = await advancedAnalyticsService.generateDashboard({
      start,
      end,
    })

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error("Advanced analytics error:", error)
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 })
  }
}
