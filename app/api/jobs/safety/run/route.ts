import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { scoreContent, actionForScore, createSafetyFlag } from "@/lib/safety"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST: server/admin-only. Scans last N hours of content,
 * scores text, creates flags, and auto-hides when needed.
 * Accepts optional body { hours?: number, limit?: number }
 *
 * This route should be called by an authenticated admin or Vercel Cron with service role.
 */
export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Verify admin access
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const hours = body.hours || 24
    const limit = body.limit || 1000

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    let scanned = 0
    let flagged = 0
    let autohid = 0

    // Scan posts
    const { data: posts } = await supabase
      .from("posts")
      .select("id, body, is_hidden")
      .gte("created_at", cutoff)
      .limit(limit)

    if (posts) {
      for (const post of posts) {
        if (post.is_hidden) continue // Skip already hidden content

        const { score, reasons } = scoreContent(post.body)
        const action = actionForScore(score)

        scanned++

        if (action === "autohide") {
          // Hide the post
          await supabase.from("posts").update({ is_hidden: true }).eq("id", post.id)

          // Create safety flag
          await createSafetyFlag(supabase, "post", post.id, reasons[0] || "automated", score)
          autohid++
        } else if (action === "flag") {
          // Create safety flag but leave visible
          await createSafetyFlag(supabase, "post", post.id, reasons[0] || "automated", score)
          flagged++
        }
      }
    }

    // Scan comments
    const { data: comments } = await supabase
      .from("post_comments")
      .select("id, body, is_hidden")
      .gte("created_at", cutoff)
      .limit(limit)

    if (comments) {
      for (const comment of comments) {
        if (comment.is_hidden) continue

        const { score, reasons } = scoreContent(comment.body)
        const action = actionForScore(score)

        scanned++

        if (action === "autohide") {
          await supabase.from("post_comments").update({ is_hidden: true }).eq("id", comment.id)

          await createSafetyFlag(supabase, "comment", comment.id, reasons[0] || "automated", score)
          autohid++
        } else if (action === "flag") {
          await createSafetyFlag(supabase, "comment", comment.id, reasons[0] || "automated", score)
          flagged++
        }
      }
    }

    // Scan reels
    const { data: reels } = await supabase
      .from("reels")
      .select("id, caption, is_hidden")
      .gte("created_at", cutoff)
      .limit(limit)

    if (reels) {
      for (const reel of reels) {
        if (reel.is_hidden || !reel.caption) continue

        const { score, reasons } = scoreContent(reel.caption)
        const action = actionForScore(score)

        scanned++

        if (action === "autohide") {
          await supabase.from("reels").update({ is_hidden: true }).eq("id", reel.id)

          await createSafetyFlag(supabase, "reel", reel.id, reasons[0] || "automated", score)
          autohid++
        } else if (action === "flag") {
          await createSafetyFlag(supabase, "reel", reel.id, reasons[0] || "automated", score)
          flagged++
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: { scanned, flagged, autohid },
    })
  } catch (error) {
    console.error("Safety scan error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
