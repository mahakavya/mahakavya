import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's groups with member information
    const { data: groups, error } = await supabase
      .from("group_conversations")
      .select(`
        *,
        group_members!inner(role, joined_at),
        profiles!group_conversations_created_by_fkey(full_name, avatar_url)
      `)
      .eq("group_members.user_id", user.id)
      .order("last_activity", { ascending: false })

    if (error) {
      console.error("Error fetching groups:", error)
      return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 })
    }

    // Transform the data to match our interface
    const transformedGroups =
      groups?.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        avatar_url: group.avatar_url,
        member_count: group.member_count || 0,
        privacy: group.privacy,
        created_at: group.created_at,
        created_by: group.created_by,
        is_admin: group.group_members[0]?.role === "admin",
        last_activity: group.last_activity,
        ai_enabled: group.ai_enabled || false,
        blockchain_verified: group.blockchain_verified || false,
        rpa_automated: group.rpa_automated || false,
        engagement_score: group.engagement_score || 0,
        category: group.category || "general",
      })) || []

    return NextResponse.json({ groups: transformedGroups })
  } catch (error) {
    console.error("Error in groups API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { name, description, privacy, category, ai_enabled, blockchain_verified, rpa_automated, max_members } = body

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from("group_conversations")
      .insert({
        name,
        description,
        privacy: privacy || "private",
        category: category || "general",
        created_by: user.id,
        ai_enabled: ai_enabled || false,
        blockchain_verified: blockchain_verified || false,
        rpa_automated: rpa_automated || false,
        max_members: max_members || 50,
        member_count: 1,
      })
      .select()
      .single()

    if (groupError) {
      console.error("Error creating group:", groupError)
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
    }

    // Add creator as admin member
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "admin",
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error("Error adding group member:", memberError)
      // Clean up the group if member addition fails
      await supabase.from("group_conversations").delete().eq("id", group.id)
      return NextResponse.json({ error: "Failed to create group membership" }, { status: 500 })
    }

    // Log group creation for blockchain if enabled
    if (blockchain_verified) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blockchain/log-group-creation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: group.id,
          creator_id: user.id,
          action: "group_created",
        }),
      }).catch(console.error)
    }

    // Initialize RPA automation if enabled
    if (rpa_automated) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rpa/initialize-group-automation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: group.id,
          settings: {
            auto_moderation: true,
            engagement_optimization: true,
            smart_notifications: true,
          },
        }),
      }).catch(console.error)
    }

    return NextResponse.json({
      ...group,
      is_admin: true,
      engagement_score: 0,
    })
  } catch (error) {
    console.error("Error in create group API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
