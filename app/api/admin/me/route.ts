import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { assertAdmin } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await assertAdmin(sb, user.id)
      return NextResponse.json({ isAdmin: true })
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }
  } catch (error) {
    console.error("Error in admin me:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
