import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

    // Get users that the current user is not following
    const { data: following } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)

    const followingIds = following?.map((f) => f.following_id) || []
    followingIds.push(user.id) // Exclude self

    // Get suggested profiles
    const query = supabase
      .from("profiles")
      .select(`
        id,
        name,
        avatar_url,
        verified,
        followers_count
      `)
      .not("id", "in", `(${followingIds.join(",")})`)
      .eq("is_active", true)
      .order("followers_count", { ascending: false })
      .limit(5)

    const { data: profiles, error } = await query

    if (error) {
      console.error("Error fetching suggested profiles:", error)
      return NextResponse.json({ error: "Failed to fetch suggested profiles" }, { status: 500 })
    }

    // Calculate mutual connections for each profile
    const suggestedProfiles = await Promise.all(
      (profiles || []).map(async (profile) => {
        // Get mutual connections
        const { count: mutualConnections } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profile.id)
          .in("following_id", followingIds.slice(0, -1)) // Exclude self from followingIds

        return {
          id: profile.id,
          name: profile.name || "Unknown User",
          avatar: profile.avatar_url,
          verified: profile.verified || false,
          followers_count: profile.followers_count || 0,
          mutual_connections: mutualConnections || 0,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      profiles: suggestedProfiles,
    })
  } catch (error) {
    console.error("Error in suggested profiles API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
