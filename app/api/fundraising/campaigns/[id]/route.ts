import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { CampaignUpdateSchema } from "@/lib/validators"
import { assertServerEnv } from "@/config/env"
import { deleteCampaignCover, getStoragePathFromUrl } from "@/lib/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select(`
        id,
        title,
        description,
        goal_amount,
        raised_amount,
        cover_url,
        status,
        created_at,
        updated_at,
        owner:profiles!campaigns_owner_id_fkey(
          id,
          name,
          avatar_url
        )
      `)
      .eq("id", params.id)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check access permissions
    const isOwner = session?.user.id === campaign.owner.id
    const isPublic = campaign.status === "live"

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Get campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user owns the campaign
    const { data: campaign } = await supabase.from("campaigns").select("owner_id").eq("id", params.id).single()

    if (!campaign || campaign.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Campaign not found or access denied" }, { status: 404 })
    }

    const body = await request.json()
  const input = CampaignUpdateSchema.parse(body)

  const updateData: any = {}
  if (input.title !== undefined) updateData.title = input.title
  if (input.description !== undefined) updateData.description = input.description
  if (input.goal_amount !== undefined) updateData.goal_amount = input.goal_amount
  if (input.image_url !== undefined) updateData.cover_url = input.image_url

    const { data: updatedCampaign, error } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update campaign:", error)
      return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 })
    }

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertServerEnv()

    const supabase = createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get campaign details
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("owner_id, cover_url")
      .eq("id", params.id)
      .single()

    if (!campaign || campaign.owner_id !== session.user.id) {
      return NextResponse.json({ error: "Campaign not found or access denied" }, { status: 404 })
    }

    // Delete the campaign
    const { error } = await supabase.from("campaigns").delete().eq("id", params.id)

    if (error) {
      console.error("Failed to delete campaign:", error)
      return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 })
    }

    // Best effort: delete cover image from storage
    if (campaign.cover_url) {
      try {
        const path = getStoragePathFromUrl(campaign.cover_url)
        if (path) {
          await deleteCampaignCover(path)
        }
      } catch (storageError) {
        console.warn("Failed to delete campaign cover:", storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete campaign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
