import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ListenerCreateSchema } from "@/lib/validators"
import { z } from "zod"

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

    const { data: listener, error } = await supabase
      .from("listeners")
      .select(`
        user_id,
        bio,
        expertise,
        rating,
        is_active,
        created_at
      `)
      .eq("user_id", session.user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Listener profile not found" }, { status: 404 })
      }
      console.error("Error fetching listener:", error)
      return NextResponse.json({ error: "Failed to fetch listener profile" }, { status: 500 })
    }

    return NextResponse.json({ listener })
  } catch (error) {
    console.error("Listener GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const validatedData = ListenerCreateSchema.partial()
      .extend({
        is_active: z.boolean().optional(),
      })
      .parse(body)

    const { data: listener, error } = await supabase
      .from("listeners")
      .update(validatedData)
      .eq("user_id", session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating listener:", error)
      return NextResponse.json({ error: "Failed to update listener profile" }, { status: 500 })
    }

    return NextResponse.json({ listener })
  } catch (error) {
    console.error("Listener PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
