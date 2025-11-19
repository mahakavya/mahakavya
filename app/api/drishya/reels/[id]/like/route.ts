import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reelId = params.id

    // Check if already liked
    const { data: existingLike } = await supabase
      .from("reel_likes")
      .select("id")
      .eq("reel_id", reelId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Unlike - remove the like
      const { error: deleteError } = await supabase
        .from("reel_likes")
        .delete()
        .eq("reel_id", reelId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Failed to unlike reel:", deleteError)
        return NextResponse.json({ error: "Failed to unlike reel" }, { status: 500 })
      }

      // Decrement likes count
      const { error: updateError } = await supabase.rpc("decrement_reel_likes", {
        reel_id: reelId,
      })

      if (updateError) {
        console.error("Failed to update likes count:", updateError)
      }

      return NextResponse.json({ liked: false })
    } else {
      // Like - add the like
      const { error: insertError } = await supabase.from("reel_likes").insert({
        reel_id: reelId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Failed to like reel:", insertError)
        return NextResponse.json({ error: "Failed to like reel" }, { status: 500 })
      }

      // Increment likes count
      const { error: updateError } = await supabase.rpc("increment_reel_likes", {
        reel_id: reelId,
      })

      if (updateError) {
        console.error("Failed to update likes count:", updateError)
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Like toggle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
