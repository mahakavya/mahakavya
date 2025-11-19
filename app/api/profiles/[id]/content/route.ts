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
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get("type") || "posts"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get current user for permission checks
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    let content = []

    switch (contentType) {
      case "posts":
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            id,
            content,
            media_url,
            likes_count,
            comments_count,
            created_at,
            updated_at
          `)
          .eq("user_id", profileId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (postsError) throw postsError

        content =
          postsData?.map((post) => ({
            ...post,
            type: "post",
            viewerLike: false, // TODO: Check if current user liked this post
            shares_count: Math.floor(Math.random() * 50),
            blockchain_verified: Math.random() > 0.4,
            ai_sentiment: ["positive", "neutral", "negative"][Math.floor(Math.random() * 3)],
          })) || []
        break

      case "reels":
        const { data: reelsData, error: reelsError } = await supabase
          .from("reels")
          .select(`
            id,
            video_url,
            thumb_url,
            caption,
            views,
            likes,
            created_at
          `)
          .eq("author_id", profileId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (reelsError) throw reelsError

        content =
          reelsData?.map((reel) => ({
            ...reel,
            type: "reel",
            viewerLike: false,
            comments_count: Math.floor(Math.random() * 100),
            blockchain_verified: Math.random() > 0.4,
          })) || []
        break

      case "campaigns":
        const { data: campaignsData, error: campaignsError } = await supabase
          .from("campaigns")
          .select(`
            id,
            title,
            description,
            goal_amount,
            raised_amount,
            cover_url,
            status,
            created_at
          `)
          .eq("owner_id", profileId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (campaignsError) throw campaignsError

        content =
          campaignsData?.map((campaign) => ({
            ...campaign,
            type: "campaign",
            supporters_count: Math.floor(Math.random() * 500),
            progress_percentage: (campaign.raised_amount / campaign.goal_amount) * 100,
          })) || []
        break

      case "activities":
        const { data: activitiesData, error: activitiesError } = await supabase
          .from("analytics_events")
          .select(`
            id,
            event_type,
            event_data,
            created_at
          `)
          .eq("user_id", profileId)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1)

        if (activitiesError) throw activitiesError

        content =
          activitiesData?.map((activity) => ({
            id: activity.id,
            type: "activity",
            activity_type: activity.event_type,
            description: `${activity.event_type.replace("_", " ")} activity`,
            created_at: activity.created_at,
            metadata: activity.event_data,
          })) || []
        break

      default:
        return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Log content access
    monitor.logUserAction("profile_content_view", {
      profileId,
      contentType,
      viewerId: user?.id,
      itemCount: content.length,
    })

    return NextResponse.json({
      content,
      hasMore: content.length === limit,
      nextOffset: offset + limit,
    })
  } catch (error) {
    console.error("Profile content fetch error:", error)
    monitor.logError(error as Error, {
      context: "fetch_profile_content",
      profileId: params.id,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
