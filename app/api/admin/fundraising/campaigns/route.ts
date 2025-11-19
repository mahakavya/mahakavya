import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

// This route reads `request.url` (query params) — force dynamic to avoid static export errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const category = searchParams.get("category") || "all"
    const risk = searchParams.get("risk") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

  const supabase = createSupabaseServerClient()
  const sb: any = supabase as any
  let query = sb
      .from("fundraising_campaigns_with_details")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,creator_name.ilike.%${search}%`)
    }

    if (status !== "all") {
      query = query.eq("status", status)
    }

    if (category !== "all") {
      query = query.eq("category", category)
    }

    if (risk !== "all") {
      query = query.eq("risk_level", risk)
    }

    const { data, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 })
    }

    // Transform data to match frontend interface
    const campaigns =
      data?.map((campaign: any) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        targetAmount: campaign.target_amount,
        raisedAmount: campaign.raised_amount,
        donorCount: campaign.donor_count,
        status: campaign.status,
        priority: campaign.priority || "medium",
        riskLevel: campaign.risk_level || "low",
        aiScore: campaign.ai_score || 0.5,
        blockchainVerified: campaign.blockchain_verified || false,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        endDate: campaign.end_date,
        creator: {
          id: campaign.creator_id,
          name: campaign.creator_name,
          email: campaign.creator_email,
          avatar: campaign.creator_avatar,
          verified: campaign.creator_verified || false,
          reputation: campaign.creator_reputation || 0,
        },
        location: campaign.location,
        images: campaign.images || [],
        videos: campaign.videos || [],
        tags: campaign.tags || [],
        moderationNotes: campaign.moderation_notes,
        lastModeratedAt: campaign.last_moderated_at,
        lastModeratedBy: campaign.last_moderated_by,
        analytics: {
          views: campaign.view_count || 0,
          shares: campaign.share_count || 0,
          engagement: campaign.engagement_rate || 0,
          conversionRate: campaign.conversion_rate || 0,
        },
      })) || []

    return NextResponse.json({ success: true, data: campaigns })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
