import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's referral code
    const { data: codeData } = await supabase.from("referral_codes").select("code").eq("owner_id", user.id).single()

    // Get user's referrals
    const { data: referrals } = await supabase
      .from("referrals")
      .select(`
        id,
        status,
        created_at,
        profiles:invitee_id (
          name,
          email
        )
      `)
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false })

    // Get banked credits
    const { data: credits } = await supabase.from("referral_credits").select("days").eq("user_id", user.id).single()

    return NextResponse.json({
      code: codeData?.code || null,
      referrals: referrals || [],
      creditsDays: credits?.days || 0,
    })
  } catch (error) {
    console.error("Referrals me error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
