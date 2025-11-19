import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const groupId = params.id

    // Check if group exists and get its details
    const { data: group, error: groupError } = await supabase
      .from("group_conversations")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: "Already a member of this group" }, { status: 400 })
    }

    // Check if group has reached max members
    if (group.max_members && group.member_count >= group.max_members) {
      return NextResponse.json({ error: "Group is full" }, { status: 400 })
    }

    // Check privacy settings
    if (group.privacy === "secret") {
      return NextResponse.json({ error: "Cannot join secret groups without invitation" }, { status: 403 })
    }

    // Add user as member
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: groupId,
      user_id: user.id,
      role: "member",
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error("Error adding group member:", memberError)
      return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
    }

    // Update member count
    const { error: updateError } = await supabase
      .from("group_conversations")
      .update({
        member_count: group.member_count + 1,
        last_activity: new Date().toISOString(),
      })
      .eq("id", groupId)

    if (updateError) {
      console.error("Error updating member count:", updateError)
    }

    // Add system message about user joining
    await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      content: `${user.user_metadata?.full_name || user.email} joined the group`,
      message_type: "system",
    })

    // Log blockchain record if group has blockchain verification
    if (group.blockchain_verified) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blockchain/log-group-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          user_id: user.id,
          action: "member_join",
        }),
      }).catch(console.error)
    }

    // Trigger RPA onboarding if enabled
    if (group.rpa_automated) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/rpa/trigger-member-onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          user_id: user.id,
        }),
      }).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in join group API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
