import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"
import { monitor } from "@/lib/monitoring"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()
    const profileId = params.id

    // Get current user for permission checks
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        avatar_url,
        bio,
        website,
        location,
        created_at,
        verification_status,
        reputation_score
      `)
      .eq("id", profileId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get follower/following counts
    const { count: followersCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", profileId)

    const { count: followingCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profileId)

    // Get content counts
    const { count: postsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("is_hidden", false)

    const { count: reelsCount } = await supabase
      .from("reels")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profileId)
      .eq("is_hidden", false)

    const { count: campaignsCount } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", profileId)

    // Check if current user follows this profile
    let isFollowing = false
    if (user && user.id !== profileId) {
      const { data: followData } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("followee_id", profileId)
        .single()

      isFollowing = !!followData
    }

    // Calculate total raised from campaigns
    const { data: campaignStats } = await supabase.from("campaigns").select("raised_amount").eq("owner_id", profileId)

    const totalRaised = campaignStats?.reduce((sum, campaign) => sum + (campaign.raised_amount || 0), 0) || 0

    // Calculate engagement rate (simplified)
    const engagementRate = Math.min(
      ((postsCount || 0) * 2 + (reelsCount || 0) * 3 + (followersCount || 0) * 0.1) / 10,
      100,
    )

    const enrichedProfile = {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      posts_count: postsCount || 0,
      reels_count: reelsCount || 0,
      campaigns_count: campaignsCount || 0,
      total_raised: totalRaised,
      engagement_rate: engagementRate,
      is_following: isFollowing,
      is_own_profile: user?.id === profileId,
      blockchain_verified: Math.random() > 0.3, // Mock blockchain verification
    }

    // Log profile view
    monitor.logUserAction("profile_view", {
      profileId,
      viewerId: user?.id,
      isOwnProfile: user?.id === profileId,
    })

    return NextResponse.json({ profile: enrichedProfile })
  } catch (error) {
    console.error("Profile fetch error:", error)
    monitor.logError(error as Error, { context: "fetch_profile", profileId: params.id })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()
    const profileId = params.id

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user can edit this profile
    if (user.id !== profileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, bio, website, location } = body

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name,
        bio,
        website,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId)
      .select()
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    monitor.logUserAction("profile_update", { profileId, changes: Object.keys(body) })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("Profile update error:", error)
    monitor.logError(error as Error, { context: "update_profile", profileId: params.id })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
