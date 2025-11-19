import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"
import { assertWithinLimit, getClientIp } from "@/lib/rate"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ClaimSchema = z.object({
  code: z.string().min(6).max(10),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limit referral claims
    try {
      await assertWithinLimit({
        sb: supabase,
        route: "/api/referrals/claim",
        windowMs: 300_000, // 5 minutes
        max: 3,
        userId: user.id,
        ip: getClientIp(request),
      })
    } catch (e: any) {
      if (e?.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { "Retry-After": String(e.retryAfter ?? 60), "content-type": "application/json" },
        })
      }
      throw e
    }

    const body = await request.json()
    const { code } = ClaimSchema.parse(body)
    const normalizedCode = code.trim().toUpperCase()

    // Check if user already has a referral
    const { data: existingReferral } = await supabase.from("referrals").select("id").eq("invitee_id", user.id).single()

    if (existingReferral) {
      return NextResponse.json({ error: "You have already used a referral code" }, { status: 400 })
    }

    // Find the referral code and inviter
    const { data: referralCode } = await supabase
      .from("referral_codes")
      .select("code, owner_id")
      .eq("code", normalizedCode)
      .single()

    if (!referralCode) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 400 })
    }

    // Prevent self-referral
    if (referralCode.owner_id === user.id) {
      return NextResponse.json({ error: "You cannot use your own referral code" }, { status: 400 })
    }

    // Create the referral
    const { error } = await supabase.from("referrals").insert({
      code: normalizedCode,
      inviter_id: referralCode.owner_id,
      invitee_id: user.id,
      status: "claimed",
    })

    if (error) {
      console.error("Error creating referral:", error)
      return NextResponse.json({ error: "Failed to claim referral code" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Referral claim error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
