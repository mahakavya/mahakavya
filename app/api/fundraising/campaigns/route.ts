import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { CampaignCreateSchema, CampaignListQuerySchema } from "@/lib/validators"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    assertServerEnv()

    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get("status")
    const isMine = rawStatus === "mine"

    // Parse only the fields that CampaignListQuerySchema expects.
    const query = CampaignListQuerySchema.parse({
      status: isMine ? undefined : rawStatus,
      limit: searchParams.get("limit"),
      sort: searchParams.get("sort"),
      page: searchParams.get("page"),
      category: searchParams.get("category"),
    })

    // Keep raw search and cursor separately
    const rawSearch = searchParams.get("search")
    const rawCursor = searchParams.get("cursor")

    const supabase = createSupabaseServerClient()

    // Build query based on status
    let queryBuilder = supabase.from("campaigns").select(`
        id,
        title,
        description,
        goal_amount,
        raised_amount,
        cover_url,
        status,
        created_at,
        owner:profiles!campaigns_owner_id_fkey(
          id,
          name,
          avatar_url
        )
      `)

    // Handle different status filters
    if (isMine) {
      // Require auth for "mine" status
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }
      queryBuilder = queryBuilder.eq("owner_id", session.user.id)
    } else {
      // Public queries only show live campaigns
      queryBuilder = queryBuilder.eq("status", "active")
    }

    // Add search filter
    if (rawSearch) {
      queryBuilder = queryBuilder.or(`title.ilike.%${rawSearch}%,description.ilike.%${rawSearch}%`)
    }

    // Add cursor pagination
    if (rawCursor) {
      queryBuilder = queryBuilder.lt("created_at", rawCursor)
    }

    // Order and limit
    queryBuilder = queryBuilder
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(query.limit + 1) // Fetch one extra to determine if there's a next page

    const { data: campaigns, error } = await queryBuilder

    if (error) {
      console.error("Failed to fetch campaigns:", error)
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
    }

    // Determine if there's a next page
    const hasMore = campaigns.length > query.limit
    const items = hasMore ? campaigns.slice(0, -1) : campaigns
    const nextCursor = hasMore ? items[items.length - 1]?.created_at : null

    return NextResponse.json({
      items,
      nextCursor,
    })
  } catch (error) {
    console.error("Campaigns API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user has active subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .single()

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json({ error: "Active subscription required" }, { status: 403 })
    }

    const body = await request.json()
    const input = CampaignCreateSchema.parse(body)

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        title: input.title,
        description: input.description,
        goal_amount: input.goal_amount,
        cover_url: input.image_url,
        owner_id: session.user.id,
        status: "draft",
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create campaign:", error)
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
    }

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
