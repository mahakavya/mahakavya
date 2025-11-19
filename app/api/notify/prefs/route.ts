import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV } from "@/config/env"

export async function GET(request: NextRequest) {
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

    // Get notification preferences
    const { data: preferences, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error fetching notification preferences:", error)
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      push_notifications: true,
      feed_likes: true,
      feed_comments: true,
      new_followers: true,
      campaign_updates: true,
      system_updates: true,
      marketing: false,
    }

    return NextResponse.json({
      preferences: preferences || defaultPreferences,
    })
  } catch (error) {
    console.error("Error in notification preferences API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    const preferences = await request.json()

    // Upsert notification preferences
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error updating notification preferences:", error)
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json({ preferences: data })
  } catch (error) {
    console.error("Error in notification preferences API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
