import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get client IP and user agent
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Record the view
    const { error } = await supabase.from("campaign_views").insert({
      campaign_id: params.id,
      user_id: session?.user.id || null,
      ip_address: ip,
      user_agent: userAgent,
    })

    if (error) {
      console.error("Failed to record view:", error)
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
