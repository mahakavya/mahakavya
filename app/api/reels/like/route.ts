import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ReelLikeSchema } from "@/lib/validators"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
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
  const { reel_id } = ReelLikeSchema.parse(body)

    // Use RPC function for atomic like toggle
    const { data: result, error: rpcError } = await supabase.rpc("toggle_reel_like", {
      reel_uuid: reel_id,
      user_uuid: user.id,
    })

    if (rpcError) {
      console.error("Failed to toggle reel like:", rpcError)
      return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Reel like toggle error:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
