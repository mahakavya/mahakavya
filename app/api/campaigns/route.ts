import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getCurrentProfile } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "10"), 50)
    const cursor = searchParams.get("cursor")
    const status = searchParams.get("status") || "live"
    const search = searchParams.get("search")

    let query = supabase
      .from("campaigns")
      .select(`
        id,
        title,
        description,
        goal_amount,
        raised_amount,
        cover_url,
        category,
        status,
        end_date,
        is_featured,
        created_at,
        owner:profiles!campaigns_owner_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error("Error fetching campaigns:", error)
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
    }

    const campaignsWithOwner =
      campaigns?.map((campaign) => ({
        ...campaign,
        owner: {
          id: campaign.owner.id,
          name: campaign.owner.full_name || "Anonymous",
          avatar_url: campaign.owner.avatar_url,
        },
        progress: campaign.goal_amount > 0 ? (campaign.raised_amount / campaign.goal_amount) * 100 : 0,
      })) || []

    const nextCursor = campaigns && campaigns.length === limit ? campaigns[campaigns.length - 1].created_at : null
    const hasMore = campaigns ? campaigns.length === limit : false

    return NextResponse.json({
      items: campaignsWithOwner,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("Campaigns API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const profile = await getCurrentProfile(supabase)

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, goal_amount, category, end_date, cover_url } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!goal_amount || goal_amount < 1000) {
      return NextResponse.json({ error: "Goal amount must be at least ₹1,000" }, { status: 400 })
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        owner_id: profile.id,
        title: title.trim(),
        description: description?.trim(),
        goal_amount,
        category: category || "other",
        end_date,
        cover_url,
        status: "live", // Auto-publish for now
      })
      .select(`
        id,
        title,
        description,
        goal_amount,
        raised_amount,
        cover_url,
        category,
        status,
        end_date,
        is_featured,
        created_at,
        owner:profiles!campaigns_owner_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error("Error creating campaign:", error)
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
    }

    const campaignWithOwner = {
      ...campaign,
      owner: {
        id: campaign.owner.id,
        name: campaign.owner.full_name || "Anonymous",
        avatar_url: campaign.owner.avatar_url,
      },
      progress: 0,
    }

    return NextResponse.json(campaignWithOwner, { status: 201 })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
