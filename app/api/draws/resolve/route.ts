import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ENV, assertServerEnv } from "@/config/env"
import { DrawResolveSchema } from "@/lib/validators"
import { getSession } from "@/lib/db"
import crypto from "crypto"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    assertServerEnv()
  const supabase = createClient(ENV.SUPABASE_URL!, ENV.SERVICE_ROLE_KEY!)
  const session = await getSession(supabase)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (implement your admin check logic here)
    // For now, we'll allow any authenticated user to resolve draws
    // In production, you should check user roles

    const body = await request.json()
    const data = DrawResolveSchema.parse(body)


    // Fetch draw details
    const { data: draw, error: drawError } = await supabase
      .from("draws")
      .select("id, title, draw_at, status, seed, result")
      .eq("id", data.draw_id)
      .single()

    if (drawError || !draw) {
      return NextResponse.json({ error: "Draw not found" }, { status: 404 })
    }

    if (draw.status === "completed") {
      return NextResponse.json({ error: "Draw already completed" }, { status: 400 })
    }

    const now = new Date()
    const drawTime = new Date(draw.draw_at)

    if (now < drawTime) {
      return NextResponse.json({ error: "Draw time has not arrived yet" }, { status: 400 })
    }

    // Close the draw if it's still upcoming
    if (draw.status === "upcoming") {
      const { error: closeError } = await supabase.rpc("close_draw", {
        p_draw: data.draw_id,
        p_closed_at: now.toISOString(),
      })

      if (closeError) {
        console.error("Failed to close draw:", closeError)
        return NextResponse.json({ error: "Failed to close draw" }, { status: 500 })
      }
    }

    // Fetch all entries for this draw
    const { data: entries, error: entriesError } = await supabase
      .from("entries")
      .select("user_id, created_at")
      .eq("draw_id", data.draw_id)
      .order("created_at", { ascending: true })

    if (entriesError) {
      console.error("Failed to fetch entries:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

  if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found for this draw" }, { status: 400 })
    }

    // Get the closed_at timestamp from the result
  const { data: updatedDraw } = await supabase.from("draws").select("result").eq("id", data.draw_id).single()

    const closedAt = updatedDraw?.result?.closed_at || now.toISOString()

    // Compute deterministic winner
    const anchor = `${draw.seed}:${closedAt}`
    const hash = crypto.createHash("sha256").update(anchor).digest("hex")
    const hashBigInt = BigInt("0x" + hash)
    const winnerIndex = Number(hashBigInt % BigInt(entries.length))
    const winner = entries[winnerIndex]

    // Prepare result object
    const result = {
      closed_at: closedAt,
      algorithm: "sha256(seed + ':' + closed_at) % N",
      N: entries.length,
      winner_user_id: winner.user_id,
      proof: {
        seed: draw.seed,
        closed_at: closedAt,
        hash: hash,
      },
    }

    // Update draw with result and completed status
    const { error: updateError } = await supabase
      .from("draws")
      .update({
        status: "completed",
        result: result,
      })
      .eq("id", data.draw_id)

    if (updateError) {
      console.error("Failed to update draw result:", updateError)
      return NextResponse.json({ error: "Failed to update draw result" }, { status: 500 })
    }

    return NextResponse.json({
      winnerUserId: winner.user_id,
      result: result,
    })
  } catch (error) {
    console.error("Resolve draw error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
