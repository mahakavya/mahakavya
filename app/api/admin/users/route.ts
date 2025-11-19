import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { assertAdmin } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort_by: z.enum(["created_at", "last_active", "name", "ai_risk_score", "reputation_score"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum(["active", "suspended", "banned", "pending"]).optional(),
  role: z.enum(["user", "moderator", "admin", "super_admin"]).optional(),
  search: z.string().optional(),
})

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

    const { searchParams } = new URL(request.url)
    const { page, limit, sort_by, sort_order, status, role, search } = UserQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      sort_by: searchParams.get("sort_by"),
      sort_order: searchParams.get("sort_order"),
      status: searchParams.get("status"),
      role: searchParams.get("role"),
      search: searchParams.get("search"),
    })

    const offset = (page - 1) * limit

    let query = supabase
      .from("profiles")
      .select(`
        id,
        email,
        name,
        avatar_url,
        phone,
        location,
        bio,
        status,
        role,
        is_verified,
        subscription_status,
        created_at,
        updated_at,
        last_active,
        login_count,
        content_count,
        violation_count,
        ai_risk_score,
        blockchain_verified,
        reputation_score,
        engagement_rate,
        referral_count,
        total_spent,
        preferences,
        metadata
      `)
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }
    if (role) {
      query = query.eq("role", role)
    }
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,location.ilike.%${search}%`,
      )
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: data?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error in admin users GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
