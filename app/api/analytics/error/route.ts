import { type NextRequest, NextResponse } from "next/server"
import { monitoring } from "@/lib/monitoring"

export async function POST(request: NextRequest) {
  try {
    const { error, context, ...metadata } = await request.json()

    monitoring.trackError({
      message: error,
      severity: "medium",
      context: { ...metadata, context },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Failed to log error:", err)
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 })
  }
}
