import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"

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

    // Get comprehensive admin statistics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalContent },
      { count: pendingModeration },
      { count: flaggedContent },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "flagged"),
    ])

    // Calculate system health (mock calculation)
    const systemHealth = Math.floor(Math.random() * 10) + 90 // 90-100%
    const aiProcessingQueue = Math.floor(Math.random() * 50) + 10
    const blockchainTransactions = Math.floor(Math.random() * 100) + 50
    const rpaJobsRunning = Math.floor(Math.random() * 10) + 2
    const storageUsed = Math.floor(Math.random() * 30) + 60 // 60-90%
    const bandwidthUsed = Math.floor(Math.random() * 40) + 40 // 40-80%
    const errorRate = Math.random() * 2 + 0.5 // 0.5-2.5%

    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalContent: totalContent || 0,
      pendingModeration: pendingModeration || 0,
      flaggedContent: flaggedContent || 0,
      systemHealth,
      aiProcessingQueue,
      blockchainTransactions,
      rpaJobsRunning,
      storageUsed,
      bandwidthUsed,
      errorRate: Number(errorRate.toFixed(1)),
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
