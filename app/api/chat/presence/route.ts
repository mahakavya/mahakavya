import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update presence for all conversations the user is in
    const { data: conversations } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", session.user.id)

    if (conversations && conversations.length > 0) {
      const presenceUpdates = conversations.map((conv) => ({
        user_id: session.user.id,
        conversation_id: conv.conversation_id,
        last_seen: new Date().toISOString(),
        is_typing: false,
      }))

      await supabase.from("presence").upsert(presenceUpdates)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Presence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
