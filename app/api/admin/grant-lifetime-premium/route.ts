import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentProfile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!currentProfile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find user by email
    const { data: targetUser, error: findError } = await supabase
      .from("profiles")
      .select("id, email, name")
      .eq("email", email)
      .single()

    if (findError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Grant Master Admin role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_admin: true,
        role: "master_admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUser.id)

    if (updateError) {
      console.error("Error updating user role:", updateError)
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 })
    }

    // Grant lifetime premium subscription
    const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
      user_id: targetUser.id,
      status: "active",
      plan: "lifetime_premium",
      intro_used: true,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 100 years
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
    }

    // Grant all feature access
    const { error: accessError } = await supabase.from("feature_access").upsert({
      user_id: targetUser.id,
      can_feed: true,
      can_reels: true,
      can_luckydraw: true,
      can_fundraising: true,
      can_emotional: true,
      can_messaging: true,
      updated_at: new Date().toISOString(),
    })

    if (accessError) {
      console.error("Error granting feature access:", accessError)
      return NextResponse.json({ error: "Failed to grant feature access" }, { status: 500 })
    }

    // Log the action
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_type: "admin_grant_lifetime_premium",
      event_data: {
        target_user_id: targetUser.id,
        target_email: email,
        granted_by: user.id,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Lifetime premium access granted to ${email}`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: "master_admin",
        subscription: "lifetime_premium",
      },
    })
  } catch (error) {
    console.error("Error granting lifetime premium:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
