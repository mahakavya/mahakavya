import { type NextRequest, NextResponse } from "next/server"
// Uses cookies and server auth — force dynamic to avoid prerender
export const dynamic = 'force-dynamic'
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getServerUser } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        {
          access: { isAuthenticated: false },
          user: null,
          subscription: null,
        },
        { status: 401 },
      )
    }

    // Add timeout to prevent hanging requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 10000) // 10 second timeout
    })

    const userPromise = getServerUser()

    const user = await Promise.race([userPromise, timeoutPromise])

    if (!user) {
      return NextResponse.json({ error: "Unauthorized", authenticated: false }, { status: 401 })
    }

    // Get user profile with timeout protection
    const profilePromise = supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        verified,
        subscription_status,
        subscription_tier,
        trial_ends_at,
        payment_failed
      `)
      .eq("id", session.user.id)
      .single()

    let profile = null
    let profileError = null

    try {
      const result = (await Promise.race([profilePromise, timeoutPromise])) as any
      profile = result.data
      profileError = result.error
    } catch (error) {
      console.warn("Profile fetch failed:", error)
      profileError = error
    }

    // Determine access levels (with safe defaults)
    const isSubscribed = profile?.subscription_status === "active" || false
    const isTrialActive = profile?.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false
    const hasAccess = isSubscribed || isTrialActive

    // Determine subscription tier
    const tier = profile?.subscription_tier || "free"

    // Feature access based on tier
    const featureAccess = {
      // Free tier features
      basicPosting: true,
      basicMessaging: true,
      basicProfile: true,

      // Premium features
      advancedAnalytics: hasAccess,
      prioritySupport: hasAccess,
      customThemes: hasAccess,
      advancedPrivacy: hasAccess,

      // Pro features (if tier is pro)
      adminTools: tier === "pro" && hasAccess,
      bulkOperations: tier === "pro" && hasAccess,
      apiAccess: tier === "pro" && hasAccess,
    }

    // coerce profile/user to any to satisfy TS for now; these are coming from Supabase typed results
    const _profile: any = profile
    const _user: any = user

    return NextResponse.json({
      access: {
        isAuthenticated: true,
        isSubscribed,
        isTrialActive,
        hasAccess,
        tier,
        features: featureAccess,
      },
      user: _profile
        ? {
            id: _profile.id,
            username: _profile.username,
            displayName: _profile.display_name,
            avatarUrl: _profile.avatar_url,
            verified: _profile.verified,
            trialEndsAt: _profile.trial_ends_at,
            paymentFailed: _profile.payment_failed,
          }
        : {
            id: _user?.id || null,
            username: _user?.email || null,
            displayName: _user?.user_metadata?.display_name || null,
            avatarUrl: _user?.user_metadata?.avatar_url || null,
            verified: false,
            trialEndsAt: null,
            paymentFailed: false,
          },
      subscription: profile
        ? {
            status: profile.subscription_status || "inactive",
            tier: profile.subscription_tier || "free",
            trialEndsAt: profile.trial_ends_at,
          }
        : {
            status: "inactive",
            tier: "free",
            trialEndsAt: null,
          },
    })
  } catch (error) {
    console.error("Access check error:", error)

    // Return safe defaults on error
    if (error instanceof Error && error.message === "Request timeout") {
      return NextResponse.json({ error: "Service timeout", authenticated: false }, { status: 408 })
    }

    return NextResponse.json(
      {
        access: {
          isAuthenticated: false,
          isSubscribed: false,
          isTrialActive: false,
          hasAccess: false,
          tier: "free",
          features: {
            basicPosting: true,
            basicMessaging: true,
            basicProfile: true,
            advancedAnalytics: false,
            prioritySupport: false,
            customThemes: false,
            advancedPrivacy: false,
            adminTools: false,
            bulkOperations: false,
            apiAccess: false,
          },
        },
        user: null,
        subscription: null,
        error: "Failed to check access",
      },
      { status: 500 },
    )
  }
}
