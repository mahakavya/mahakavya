import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertServerEnv } from "@/config/env"
import { monitor } from "@/lib/monitoring"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Can't follow yourself
    if (user.id === profileId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", profileId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", user.id)
      .eq("followee_id", profileId)
      .single()

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 })
    }

    // Create follow relationship
    const { error: followError } = await supabase.from("follows").insert({
      follower_id: user.id,
      followee_id: profileId,
      created_at: new Date().toISOString(),
    })

    if (followError) {
      console.error("Failed to create follow:", followError)
      return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
    }

    // Create notification for the followed user
    await supabase.from("notifications").insert({
      user_id: profileId,
      kind: "follow",
      title: "New Follower",
      body: `${user.email} started following you`,
      href: `/parichaya/${user.id}`,
      read: false,
      created_at: new Date().toISOString(),
    })

    // Log the follow action
    monitor.logUserAction("follow_user", {
      followerId: user.id,
      followeeId: profileId,
      followeeName: targetUser.full_name,
    })

    return NextResponse.json({
      success: true,
      following: true,
      message: `Now following ${targetUser.full_name}`,
    })
  } catch (error) {
    console.error("Follow error:", error)
    monitor.logError(error as Error, {
      context: "follow_user",
      profileId: params.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get target user info for logging
    const { data: targetUser } = await supabase.from("profiles").select("full_name").eq("id", profileId).single()

    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", profileId)

    if (unfollowError) {
      console.error("Failed to unfollow:", unfollowError)
      return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
    }

    // Log the unfollow action
    monitor.logUserAction("unfollow_user", {
      followerId: user.id,
      followeeId: profileId,
      followeeName: targetUser?.full_name,
    })

    return NextResponse.json({
      success: true,
      following: false,
      message: `Unfollowed ${targetUser?.full_name || "user"}`,
    })
  } catch (error) {
    console.error("Unfollow error:", error)
    monitor.logError(error as Error, {
      context: "unfollow_user",
      profileId: params.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
