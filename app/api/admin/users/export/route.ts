import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ExportFiltersSchema = z.object({
  filters: z
    .object({
      status: z.string().optional(),
      role: z.string().optional(),
      verification: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { filters } = ExportFiltersSchema.parse(body)

    let query = supabase.from("profiles").select(`
      id,
      email,
      name,
      phone,
      location,
      status,
      role,
      is_verified,
      subscription_status,
      created_at,
      last_active,
      login_count,
      content_count,
      violation_count,
      ai_risk_score,
      blockchain_verified,
      reputation_score,
      engagement_rate,
      referral_count,
      total_spent
    `)

    // Apply filters
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters?.role && filters.role !== "all") {
      query = query.eq("role", filters.role)
    }
    if (filters?.verification) {
      if (filters.verification === "verified") {
        query = query.eq("is_verified", true)
      } else if (filters.verification === "unverified") {
        query = query.eq("is_verified", false)
      } else if (filters.verification === "blockchain_verified") {
        query = query.eq("blockchain_verified", true)
      }
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("Error fetching users for export:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Generate CSV
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Location",
      "Status",
      "Role",
      "Verified",
      "Subscription",
      "Created At",
      "Last Active",
      "Login Count",
      "Content Count",
      "Violations",
      "AI Risk Score",
      "Blockchain Verified",
      "Reputation",
      "Engagement Rate",
      "Referrals",
      "Total Spent",
    ]

    const csvRows = [
      headers.join(","),
      ...(users || []).map((user) =>
        [
          user.id,
          `"${user.name || ""}"`,
          user.email,
          `"${user.phone || ""}"`,
          `"${user.location || ""}"`,
          user.status,
          user.role,
          user.is_verified,
          user.subscription_status || "",
          user.created_at,
          user.last_active || "",
          user.login_count || 0,
          user.content_count || 0,
          user.violation_count || 0,
          user.ai_risk_score || 0,
          user.blockchain_verified || false,
          user.reputation_score || 0,
          user.engagement_rate || 0,
          user.referral_count || 0,
          user.total_spent || 0,
        ].join(","),
      ),
    ]

    const csv = csvRows.join("\n")

    return NextResponse.json({
      success: true,
      csv,
      count: users?.length || 0,
    })
  } catch (error) {
    console.error("Error in users export POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
