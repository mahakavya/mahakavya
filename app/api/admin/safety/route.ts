import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertAdmin } from "@/lib/db"
import { audit } from "@/lib/audit"
import { buildPaginatedResponse, parseCursor } from "@/lib/pagination"
import { assertServerEnv } from "@/config/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Get current user and verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "open"
    const cursor = searchParams.get("cursor")
    const limit = Number.parseInt(searchParams.get("limit") || "30")

    let query = supabase
      .from("safety_flags")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    // Apply cursor pagination
    if (cursor) {
      const cursorData = parseCursor(cursor)
      if (cursorData) {
        query = query.or(
          `created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`,
        )
      }
    }

    const { data: flags, error: flagsError } = await query

    if (flagsError) {
      console.error("Failed to fetch safety flags:", flagsError)
      return NextResponse.json({ error: "Failed to fetch safety flags" }, { status: 500 })
    }

    const paginatedResponse = buildPaginatedResponse(flags || [], limit)
    return NextResponse.json(paginatedResponse)
  } catch (error) {
    console.error("Safety flags fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
    const supabase = await createSupabaseServerClient()

    // Get current user and verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(supabase, user.id)

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action" }, { status: 400 })
    }

    // Get the safety flag
    const { data: flag, error: flagError } = await supabase.from("safety_flags").select("*").eq("id", id).single()

    if (flagError || !flag) {
      return NextResponse.json({ error: "Safety flag not found" }, { status: 404 })
    }

    let newStatus = flag.status
    let contentUpdate = null

    switch (action) {
      case "mark_reviewing":
        newStatus = "reviewing"
        break
      case "dismiss":
        newStatus = "dismissed"
        break
      case "action_hide":
        newStatus = "actioned"
        contentUpdate = { is_hidden: true }
        break
      case "action_unhide":
        newStatus = "actioned"
        contentUpdate = { is_hidden: false }
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update the safety flag
    const { error: updateFlagError } = await supabase.from("safety_flags").update({ status: newStatus }).eq("id", id)

    if (updateFlagError) {
      console.error("Failed to update safety flag:", updateFlagError)
      return NextResponse.json({ error: "Failed to update safety flag" }, { status: 500 })
    }

    // Update content visibility if needed
    if (contentUpdate) {
      const tableName = flag.entity_type === "post" ? "posts" : flag.entity_type === "reel" ? "reels" : "post_comments"

      const { error: contentError } = await supabase.from(tableName).update(contentUpdate).eq("id", flag.entity_id)

      if (contentError) {
        console.error("Failed to update content visibility:", contentError)
        return NextResponse.json({ error: "Failed to update content" }, { status: 500 })
      }
    }

    // Write audit log
    await audit(supabase, user.id, "admin_safety_action", "safety_flag", id, {
      action,
      entity_type: flag.entity_type,
      entity_id: flag.entity_id,
      reason: flag.reason,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Safety action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
