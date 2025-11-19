import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { z } from "zod"
import { MessageCreateSchema } from "@/lib/validators"
import { assertWithinLimit, getClientIp } from "@/lib/rate"

const MessagesListSchema = z
  .object({
    conversationId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    cursor: z.string().datetime().optional(),
    limit: z.coerce.number().min(1).max(50).default(30),
  })
  .refine((data) => data.conversationId || data.sessionId, {
    message: "Either conversationId or sessionId must be provided",
  })

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryData = {
      conversationId: searchParams.get("conversationId"),
      sessionId: searchParams.get("sessionId"),
      cursor: searchParams.get("cursor"),
      limit: searchParams.get("limit"),
    }

    const validatedQuery = MessagesListSchema.parse(queryData)

    // Build query
    let query = supabase
      .from("messages")
      .select(`
        id,
        body,
        attachments,
        created_at,
        sender_id,
        profiles!messages_sender_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false })
      .limit(validatedQuery.limit)

    if (validatedQuery.conversationId) {
      // Existing conversation logic
      const { data: membership } = await supabase
        .from("conversation_members")
        .select("id")
        .eq("conversation_id", validatedQuery.conversationId)
        .eq("user_id", session.user.id)
        .single()

      if (!membership) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      query = query.eq("conversation_id", validatedQuery.conversationId)
    } else if (validatedQuery.sessionId) {
      // Session messages logic
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("listener_id, seeker_id")
        .eq("id", validatedQuery.sessionId)
        .single()

      if (!sessionData || (sessionData.listener_id !== session.user.id && sessionData.seeker_id !== session.user.id)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      query = query.eq("session_id", validatedQuery.sessionId)
    }

    if (validatedQuery.cursor) {
      query = query.lt("created_at", validatedQuery.cursor)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    const nextCursor = messages.length === validatedQuery.limit ? messages[messages.length - 1]?.created_at : null

    return NextResponse.json({
      items: messages.reverse(), // Return in chronological order
      nextCursor,
    })
  } catch (error) {
    console.error("Messages GET error:", error)
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

    // Apply rate limiting
    try {
      await assertWithinLimit({
        sb: supabase,
        route: "/api/chat/messages",
        windowMs: 60_000, // 1 minute
        max: 30, // 30 messages per minute
        userId: session.user.id,
        ip: getClientIp(request),
      })
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { "Retry-After": String(e.retryAfter ?? 60), "content-type": "application/json" },
        })
      }
      throw e
    }

    const body = await request.json()
    const validatedData = MessageCreateSchema.parse(body)

    // Verify user is member of conversation
    const { data: membership } = await supabase
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", validatedData.conversationId)
      .eq("user_id", session.user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Validate that either body or attachments are provided
    if (!validatedData.body && (!validatedData.attachments || validatedData.attachments.length === 0)) {
      return NextResponse.json({ error: "Message body or attachments required" }, { status: 400 })
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: validatedData.conversationId,
        sender_id: session.user.id,
        body: validatedData.body,
        attachments: validatedData.attachments || [],
        session_id: validatedData.sessionId,
      })
      .select(`
        id,
        body,
        attachments,
        created_at,
        sender_id,
        profiles!messages_sender_id_fkey (
          id,
          name,
          avatar_url
        )
      `)
      .single()

    if (messageError) {
      console.error("Error creating message:", messageError)
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
    }

    // Update sender's last_read_at
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", validatedData.conversationId)
      .eq("user_id", session.user.id)

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Messages POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
