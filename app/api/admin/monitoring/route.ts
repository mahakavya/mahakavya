import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { monitoring } from "@/lib/monitoring"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      monitoring.logApiCall("/api/admin/monitoring", "GET", Date.now() - startTime, 401)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

    if (!profile?.is_admin) {
      monitoring.logApiCall("/api/admin/monitoring", "GET", Date.now() - startTime, 403)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Generate mock monitoring data
    const mockData = {
      overview: {
        metrics: { total: 1250, recent: 45, api: 32, database: 13 },
        errors: { total: 23, recent: 2, critical: 0, high: 1 },
        health: { services: 4, healthy: 3, degraded: 1, unhealthy: 0 },
        performance: { avgApiResponseTime: 125, avgDbQueryTime: 45, errorRate: 1.2 },
      },
      metrics: [
        { name: "api_login", value: 120, unit: "ms", timestamp: Date.now() - 1000 },
        { name: "api_signup", value: 180, unit: "ms", timestamp: Date.now() - 2000 },
        { name: "db_select_profiles", value: 45, unit: "ms", timestamp: Date.now() - 3000 },
      ],
      errors: [
        {
          message: "Demo error for testing",
          severity: "low",
          timestamp: Date.now() - 5000,
          resolved: false,
        },
      ],
      health: {
        database: { status: "healthy", responseTime: 45, timestamp: Date.now() },
        cache: { status: "healthy", responseTime: 2, timestamp: Date.now() },
        memory: { status: "degraded", responseTime: null, timestamp: Date.now() },
      },
      cache: {
        hits: 156,
        misses: 23,
        sets: 89,
        deletes: 12,
        evictions: 3,
        memoryUsage: 2048576,
      },
    }

    monitoring.logApiCall("/api/admin/monitoring", "GET", Date.now() - startTime, 200, session.user.id)

    return NextResponse.json(mockData)
  } catch (error) {
    monitoring.logError(error as Error, { endpoint: "/api/admin/monitoring" })
    monitoring.logApiCall("/api/admin/monitoring", "GET", Date.now() - startTime, 500)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
