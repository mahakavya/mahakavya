import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = RequestSchema.parse(body)

    // Check for existing open request
    const { data: existing } = await supabase
      .from("delete_requests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .single()

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        status: existing.status,
        message: "You already have an open deletion request",
      })
    }

    // Create new request
    const { data: deleteRequest, error } = await supabase
      .from("delete_requests")
      .insert({
        user_id: user.id,
        reason: reason || null,
        status: "open",
      })
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      id: deleteRequest.id,
      status: deleteRequest.status,
      message: "Deletion request submitted successfully",
    })
  } catch (error) {
    console.error("Delete request failed:", error)
    return NextResponse.json({ error: "Failed to submit deletion request" }, { status: 500 })
  }
}
