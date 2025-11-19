import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { TypingSchema } from "@/lib/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    const validatedData = TypingSchema.parse(body)

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

    // Upsert presence with typing status
    const { error } = await supabase.from("presence").upsert({
      user_id: session.user.id,
      conversation_id: validatedData.conversationId,
      is_typing: validatedData.isTyping,
      last_seen: new Date().toISOString(),
    })

    if (error) {
      console.error("Error updating typing status:", error)
      return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Typing error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
