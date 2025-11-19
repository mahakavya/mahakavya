import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { FollowSchema } from "@/lib/validators"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  const body = await request.json()
  const { user_id } = FollowSchema.parse(body)

  // Can't follow yourself
  if (user_id === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user_id)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Insert follow relationship
    const { error: followError } = await supabase.from("follows").insert({
      follower_id: user.id,
      followee_id: user_id,
    })

    if (followError) {
      if (followError.code === "23505") {
        // Unique constraint violation - already following
        return NextResponse.json({ error: "Already following this user" }, { status: 409 })
      }
      console.error("Failed to create follow:", followError)
      return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, following: true })
  } catch (error) {
    console.error("Follow error:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id } = FollowSchema.parse(body)

    // Delete follow relationship
    const { error: unfollowError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", user_id)

    if (unfollowError) {
      console.error("Failed to unfollow:", unfollowError)
      return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
    }

    return NextResponse.json({ success: true, following: false })
  } catch (error) {
    console.error("Unfollow error:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
