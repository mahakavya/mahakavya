import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          subscription: null,
          status: "unconfigured",
        },
        { status: 503 },
      )
    }

    const supabase = await createSupabaseServerClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          subscription: null,
          status: "unauthenticated",
        },
        { status: 401 },
      )
    }

    // Get user's subscription status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json(
        {
          error: "Failed to fetch subscription status",
          subscription: null,
          status: "error",
        },
        { status: 500 },
      )
    }

    // Check if subscription is active and not expired
    const now = new Date()
    const expiresAt = profile.subscription_expires_at ? new Date(profile.subscription_expires_at) : null
    const isExpired = expiresAt && expiresAt < now

    const subscriptionStatus = {
      status: isExpired ? "expired" : profile.subscription_status || "inactive",
      tier: profile.subscription_tier || "free",
      expiresAt: profile.subscription_expires_at,
      isActive: profile.subscription_status === "active" && !isExpired,
    }

    return NextResponse.json({
      subscription: subscriptionStatus,
      status: "success",
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        subscription: null,
        status: "error",
      },
      { status: 500 },
    )
  }
}
