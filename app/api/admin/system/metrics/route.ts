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

    // Generate mock system metrics
    const metrics = [
      {
        id: "cpu_usage",
        name: "CPU Usage",
        value: Math.floor(Math.random() * 30) + 45,
        unit: "%",
        status: "healthy" as const,
        trend: "stable" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "memory_usage",
        name: "Memory Usage",
        value: Math.floor(Math.random() * 25) + 60,
        unit: "%",
        status: "healthy" as const,
        trend: "up" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "disk_usage",
        name: "Disk Usage",
        value: Math.floor(Math.random() * 20) + 70,
        unit: "%",
        status: "warning" as const,
        trend: "up" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "network_latency",
        name: "Network Latency",
        value: Math.floor(Math.random() * 50) + 20,
        unit: "ms",
        status: "healthy" as const,
        trend: "stable" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "database_connections",
        name: "DB Connections",
        value: Math.floor(Math.random() * 20) + 15,
        unit: "",
        status: "healthy" as const,
        trend: "down" as const,
        lastUpdated: new Date().toISOString(),
      },
    ]

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error("System metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
