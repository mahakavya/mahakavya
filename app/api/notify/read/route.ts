import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV } from "@/config/env"

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get auth header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Set auth token
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }

    const body = await request.json()
    const { notification_id, mark_all = false } = body

    if (mark_all) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "All notifications marked as read" })
    }

    if (!notification_id) {
      return NextResponse.json({ error: "notification_id is required" }, { status: 400 })
    }

    // Mark specific notification as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notification_id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error marking notification as read:", error)
      return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in notification read API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
