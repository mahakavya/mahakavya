import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { performHealthCheck } from "@/lib/monitoring"

export async function GET() {
  try {
    const health = await performHealthCheck()

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error("Health check failed:", error)

    try {
      const supabase = createServerClient()
      const { data, error: dbError } = await supabase.from("profiles").select("count").limit(1).single()

      if (dbError && dbError.code !== "PGRST116") {
        throw dbError
      }

      return NextResponse.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      })
    } catch (fallbackError) {
      return NextResponse.json(
        {
          status: "unhealthy",
          database: "disconnected",
          error: fallbackError instanceof Error ? fallbackError.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
