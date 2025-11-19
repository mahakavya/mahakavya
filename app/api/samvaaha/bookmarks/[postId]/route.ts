import { type NextRequest, NextResponse } from "next/server"
// Uses request.url — mark dynamic
export const dynamic = 'force-dynamic'
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.postId

    // Check if post exists and is viewable
    const { data: post, error: postError } = await supabase.from("posts").select("id").eq("id", postId).single()

    if (postError) {
      if (postError.code === "PGRST116") {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 })
    }

    // Check if user already bookmarked the post
    const { data: existingBookmark, error: bookmarkCheckError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    if (bookmarkCheckError && bookmarkCheckError.code !== "PGRST116") {
      console.error("Error checking existing bookmark:", bookmarkCheckError)
      return NextResponse.json({ error: "Failed to check bookmark status" }, { status: 500 })
    }

    let bookmarked = false

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Error removing bookmark:", deleteError)
        return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 })
      }

      bookmarked = false
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from("bookmarks").insert({
        post_id: postId,
        user_id: user.id,
      })

      if (insertError) {
        console.error("Error adding bookmark:", insertError)
        return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
      }

      bookmarked = true
    }

    return NextResponse.json({
      bookmarked,
    })
  } catch (error) {
    console.error("Error in POST /api/samvaaha/bookmarks/[postId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
