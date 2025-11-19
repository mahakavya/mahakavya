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

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { platform } = await request.json()

    if (!platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 })
    }

    // Record the share
    const { error } = await supabase.from("campaign_shares").insert({
      campaign_id: params.id,
      user_id: session.user.id,
      platform,
    })

    if (error) {
      console.error("Failed to record share:", error)
      return NextResponse.json({ error: "Failed to record share" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Share tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
