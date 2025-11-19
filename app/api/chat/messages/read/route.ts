import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ReadMessageSchema } from "@/lib/validators"

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
    const validatedData = ReadMessageSchema.parse(body)

    // Update last_read_at for the user in this conversation
    const { error } = await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", validatedData.conversationId)
      .eq("user_id", session.user.id)

    if (error) {
      console.error("Error updating read status:", error)
      return NextResponse.json({ error: "Failed to update read status" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Read messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
