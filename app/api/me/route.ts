import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerActionClient } from "@/lib/supabase"

// Reads cookies via Supabase action client — force dynamic to prevent static export
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerActionClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
    }

    // Fetch subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (subscriptionError) {
      console.error("Error fetching subscription:", subscriptionError)
    }

    // Fetch roles (if using RBAC)
    // `user_roles` may not be present in the generated DB types; cast to any for this query
    const { data: userRoles, error: rolesError } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)

    if (rolesError) {
      console.error("Error fetching roles:", rolesError)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
      },
      profile: profile || null,
      subscription: subscription || null,
  roles: userRoles?.map((r: any) => r.role) || [],
    })
  } catch (error) {
    console.error("Error in /api/me:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
