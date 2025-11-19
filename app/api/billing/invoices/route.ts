import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch invoices (payments with kind='invoice') for the current user
    const { data: invoices, error } = await supabase
      .from("payments")
      .select("id, amount, currency, status, created_at, meta")
      .eq("user_id", user.id)
      .eq("kind", "invoice")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Failed to fetch invoices:", error)
      return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({ invoices: invoices || [] })
  } catch (error) {
    console.error("Invoices API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
