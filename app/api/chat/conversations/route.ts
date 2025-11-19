import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ConversationCreateSchema } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get conversations with last message and unread count
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(`
        id,
        title,
        is_group,
        created_at,
        conversation_members!inner (
          user_id,
          last_read_at,
          profiles (
            id,
            name,
            avatar_url
          )
        ),
        messages (
          id,
          body,
          created_at,
          sender_id,
          attachments
        )
      `)
      .eq("conversation_members.user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching conversations:", error)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }

    // Process conversations to get the required format
    const processedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("body, created_at, attachments")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        // Get unread count
        const userMember = conv.conversation_members.find((m: any) => m.user_id === session.user.id)
        const lastReadAt = userMember?.last_read_at

        let unreadCount = 0
        if (lastReadAt) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .gt("created_at", lastReadAt)
            .neq("sender_id", session.user.id)

          unreadCount = count || 0
        }

        // Get all members
        const { data: members } = await supabase
          .from("conversation_members")
          .select(`
            profiles (
              id,
              name,
              avatar_url
            )
          `)
          .eq("conversation_id", conv.id)

        return {
          id: conv.id,
          title: conv.title,
          is_group: conv.is_group,
          last_message: lastMessage
            ? {
                body: lastMessage.body,
                created_at: lastMessage.created_at,
                has_attachments: lastMessage.attachments && lastMessage.attachments.length > 0,
              }
            : null,
          unread_count: unreadCount,
          members: members?.map((m: any) => m.profiles) || [],
        }
      }),
    )

    return NextResponse.json({ conversations: processedConversations })
  } catch (error) {
    console.error("Conversations API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ConversationCreateSchema.parse(body)

    if (validatedData.type === "direct") {
      if (!validatedData.peerEmail) {
        return NextResponse.json({ error: "Peer email required for direct chat" }, { status: 400 })
      }

      // Find peer by email
      const { data: peer, error: peerError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", validatedData.peerEmail)
        .single()

      if (peerError || !peer) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if direct conversation already exists
      const { data: existingConv } = await supabase
        .from("conversations")
        .select(`
          id,
          conversation_members!inner (user_id)
        `)
        .eq("is_group", false)
        .in("conversation_members.user_id", [session.user.id, peer.id])

      // Find conversation that has both users
      const directConv = existingConv?.find((conv) => {
        const memberIds = conv.conversation_members.map((m: any) => m.user_id)
        return memberIds.includes(session.user.id) && memberIds.includes(peer.id) && memberIds.length === 2
      })

      if (directConv) {
        return NextResponse.json({ conversation: { id: directConv.id } })
      }

      // Create new direct conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          is_group: false,
          title: null,
        })
        .select()
        .single()

      if (convError) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      // Add members
      const { error: membersError } = await supabase.from("conversation_members").insert([
        { conversation_id: newConv.id, user_id: session.user.id },
        { conversation_id: newConv.id, user_id: peer.id },
      ])

      if (membersError) {
        return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
      }

      return NextResponse.json({ conversation: { id: newConv.id } }, { status: 201 })
    } else {
      // Group conversation
      if (!validatedData.title || !validatedData.memberIds) {
        return NextResponse.json({ error: "Title and member IDs required for group chat" }, { status: 400 })
      }

      // Create group conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          is_group: true,
          title: validatedData.title,
        })
        .select()
        .single()

      if (convError) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
      }

      // Add members (including creator)
      const memberInserts = [
        { conversation_id: newConv.id, user_id: session.user.id },
        ...validatedData.memberIds.map((id) => ({
          conversation_id: newConv.id,
          user_id: id,
        })),
      ]

      const { error: membersError } = await supabase.from("conversation_members").insert(memberInserts)

      if (membersError) {
        return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
      }

      return NextResponse.json({ conversation: { id: newConv.id } }, { status: 201 })
    }
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
