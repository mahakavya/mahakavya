import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user preferences from profile or create default ones
    const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).single()

    const preferences = profile?.preferences || {
      interests: ["social_impact", "technology", "community"],
      usage_pattern: "regular",
      budget_range: "affordable",
      features_priority: ["messaging", "fundraising", "social_feed"],
    }

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("User preferences API error:", error)

    // Return default preferences
    const defaultPreferences = {
      interests: ["social_impact", "technology"],
      usage_pattern: "regular",
      budget_range: "affordable",
      features_priority: ["social_feed", "messaging"],
    }

    return NextResponse.json({ preferences: defaultPreferences })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { preferences } = await request.json()

    // Update user preferences
    const { error } = await supabase.from("profiles").update({ preferences }).eq("id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update preferences API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
