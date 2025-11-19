import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { assertAdmin, logAudit } from "@/lib/db"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ReportsQuerySchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "rejected"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
  q: z.string().optional(),
})

const ReportActionSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["resolve", "reject", "hide", "ban"]),
  note: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(sb, user.id)

    const { searchParams } = new URL(request.url)
    const { status, cursor, limit, q } = ReportsQuerySchema.parse({
      status: searchParams.get("status"),
      cursor: searchParams.get("cursor"),
      limit: searchParams.get("limit"),
      q: searchParams.get("q"),
    })

    let query = sb
      .from("reports")
      .select(`
        *,
        reporter:reporter_id(name, email),
        reported_user:reported_user_id(name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit + 1)

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }

    if (q) {
      query = query.ilike("reason", `%${q}%`)
    }

    if (cursor) {
      query = query.lt("created_at", cursor)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching reports:", error)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    const hasMore = data.length > limit
    const items = hasMore ? data.slice(0, -1) : data
    const nextCursor = hasMore ? data[data.length - 2]?.created_at : null

    return NextResponse.json({ items, nextCursor })
  } catch (error) {
    console.error("Error in admin reports GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sb = createClient()

    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await assertAdmin(sb, user.id)

    const body = await request.json()
    const { reportId, action, note } = ReportActionSchema.parse(body)

    // Get the report
    const { data: report, error: reportError } = await sb.from("reports").select("*").eq("id", reportId).single()

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Perform action
    let newStatus = "open"
    const updates: any = {}

    switch (action) {
      case "resolve":
        newStatus = "resolved"
        break
      case "reject":
        newStatus = "rejected"
        break
      case "hide":
        newStatus = "resolved"
        // Hide the content
        const table =
          report.entity_type === "post" ? "posts" : report.entity_type === "reel" ? "reels" : "post_comments"
        await sb.from(table).update({ is_hidden: true }).eq("id", report.entity_id)
        break
      case "ban":
        newStatus = "resolved"
        // Ban the reported user
        if (report.reported_user_id) {
          await sb.from("profiles").update({ is_active: false }).eq("id", report.reported_user_id)
        }
        break
    }

    if (note) {
      updates.admin_note = note
    }

    // Update report status
    const { error: updateError } = await sb
      .from("reports")
      .update({ status: newStatus, ...updates })
      .eq("id", reportId)

    if (updateError) {
      console.error("Error updating report:", updateError)
      return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
    }

    // Log audit
    await logAudit(sb, user.id, "admin_moderation", "report", reportId, {
      action,
      note,
      entity_type: report.entity_type,
      entity_id: report.entity_id,
      reported_user_id: report.reported_user_id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in admin reports POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
