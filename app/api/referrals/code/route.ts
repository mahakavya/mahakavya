import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { ENV } from "@/config/env"
import { genCode } from "@/lib/referrals"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has a code
    const { data: existingCode } = await supabase.from("referral_codes").select("code").eq("owner_id", user.id).single()

    if (existingCode) {
      return NextResponse.json({
        code: existingCode.code,
        link: `${ENV.PUBLIC_BASE_URL}/invite?code=${existingCode.code}`,
      })
    }

    // Get user profile for seed
    const { data: profile } = await supabase.from("profiles").select("email, id").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Generate and insert new code
    const code = genCode(profile.email || profile.id)

    const { data: newCode, error } = await supabase
      .from("referral_codes")
      .insert({
        code,
        owner_id: user.id,
      })
      .select("code")
      .single()

    if (error) {
      console.error("Error creating referral code:", error)
      return NextResponse.json({ error: "Failed to create referral code" }, { status: 500 })
    }

    return NextResponse.json({
      code: newCode.code,
      link: `${ENV.PUBLIC_BASE_URL}/invite?code=${newCode.code}`,
    })
  } catch (error) {
    console.error("Referral code creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
