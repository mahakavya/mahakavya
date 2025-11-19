import { type NextRequest, NextResponse } from "next/server"
import { monitoring } from "@/lib/monitoring"
import { cache } from "@/lib/cache"
import { createSupabaseServerClient } from "@/lib/supabase"
import { isDemoMode, ENV } from "@/config/env"

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    const cronSecret = ENV.CRON_SECRET

    if (!isDemoMode() && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const results = {
      cache: { cleared: false, error: null as string | null },
      monitoring: { cleared: false, error: null as string | null },
      database: { cleaned: false, error: null as string | null },
    }

    // Clear expired cache entries
    try {
      const cacheStats = cache.getStats()
      const initialSize = cache.size()

      // Force cleanup of expired entries
      cache.keys() // This triggers cleanup of expired entries

      const finalSize = cache.size()
      const clearedEntries = initialSize - finalSize

      results.cache.cleared = true
      monitoring.trackMetric("cleanup_cache_entries", clearedEntries, "count")
    } catch (error) {
      results.cache.error = error instanceof Error ? error.message : "Unknown cache cleanup error"
      monitoring.reportError(`Cache cleanup failed: ${error}`, "medium")
    }

    // Clear old monitoring data (in-memory)
    try {
      const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago

      // Get current counts
      const metricsCount = monitoring.getMetrics().length
      const errorsCount = monitoring.getErrors().length
      const healthCount = monitoring.getHealthChecks().length

      // Clear old data (this is a simplified cleanup - in a real implementation,
      // you'd filter by timestamp)
      if (metricsCount > 500) {
        monitoring.clear()
        monitoring.trackMetric("cleanup_monitoring_cleared", 1, "count")
      }

      results.monitoring.cleared = true
    } catch (error) {
      results.monitoring.error = error instanceof Error ? error.message : "Unknown monitoring cleanup error"
      monitoring.reportError(`Monitoring cleanup failed: ${error}`, "medium")
    }

    // Clean up database (if not in demo mode)
    if (!isDemoMode()) {
      try {
        const supabase = createSupabaseServerClient()

        // Clean up old performance metrics (older than 30 days)
        const { error: metricsError } = await supabase
          .from("performance_metrics")
          .delete()
          .lt("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

        // Clean up old error logs (older than 90 days)
        const { error: errorsError } = await supabase
          .from("error_logs")
          .delete()
          .lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

        // Clean up old system health records (older than 7 days)
        const { error: healthError } = await supabase
          .from("system_health")
          .delete()
          .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

        if (metricsError || errorsError || healthError) {
          throw new Error(
            `Database cleanup errors: ${[metricsError, errorsError, healthError]
              .filter(Boolean)
              .map((e) => e?.message)
              .join(", ")}`,
          )
        }

        results.database.cleaned = true
        monitoring.trackMetric("cleanup_database_success", 1, "count")
      } catch (error) {
        results.database.error = error instanceof Error ? error.message : "Unknown database cleanup error"
        monitoring.reportError(`Database cleanup failed: ${error}`, "medium")
      }
    } else {
      results.database.cleaned = true
      results.database.error = "Skipped in demo mode"
    }

    const totalDuration = Date.now() - startTime
    monitoring.trackMetric("cleanup_job_duration", totalDuration)

    // Determine overall success
    const hasErrors = results.cache.error || results.monitoring.error || results.database.error
    const allSuccessful = results.cache.cleared && results.monitoring.cleared && results.database.cleaned

    return NextResponse.json({
      success: allSuccessful && !hasErrors,
      duration: totalDuration,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    monitoring.reportError(`Cleanup job failed: ${error}`, "high")

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown cleanup error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  return POST(request)
}
