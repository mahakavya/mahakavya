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

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")

    // Mock blockchain transactions data
    const transactions = Array.from({ length: limit }, (_, i) => ({
      id: `tx_${i + 1}`,
      hash: `0x${Math.random().toString(16).substr(2, 40)}`,
      type: ["content_verification", "user_identity", "payment", "audit_log"][i % 4],
      status: ["pending", "confirmed", "failed"][Math.floor(Math.random() * 3)],
      blockNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 1000000) + 1000000 : undefined,
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    }))

    return NextResponse.json({ success: true, data: transactions })
  } catch (error) {
    console.error("Blockchain transactions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
