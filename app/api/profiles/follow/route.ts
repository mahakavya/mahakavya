import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { getCurrentProfile } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (userId === profile.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", profile.id)
      .eq("followee_id", userId)
      .single()

    let following = false

    if (existingFollow) {
      // Unfollow
      await supabase.from("follows").delete().eq("follower_id", profile.id).eq("followee_id", userId)

      following = false
    } else {
      // Follow
      await supabase.from("follows").insert({
        follower_id: profile.id,
        followee_id: userId,
        created_at: new Date().toISOString(),
      })

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        kind: "follow",
        title: "New Follower",
        body: `${profile.full_name || profile.email} started following you`,
        href: `/parichaya/${profile.id}`,
        read: false,
        created_at: new Date().toISOString(),
      })

      following = true
    }

    return NextResponse.json({ success: true, following })
  } catch (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
  }
}
