import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerActionClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerActionClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone, date_of_birth, avatar_url } = body

    // Validate required fields
    if (!full_name) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }

    // Update or create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name,
        phone,
        date_of_birth,
        avatar_url,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      console.error("Error updating profile:", profileError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("Error in /api/profile/complete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
