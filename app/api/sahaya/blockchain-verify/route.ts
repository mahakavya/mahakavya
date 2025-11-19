import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId } = body

    // Create blockchain verification transaction
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`

    const { data: transaction, error: transactionError } = await supabase
      .from("blockchain_transactions")
      .insert({
        user_id: userId,
        service: "sahaya",
        transaction_type: "profile_verification",
        transaction_hash: transactionHash,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Error creating blockchain transaction:", transactionError)
      return NextResponse.json({ error: "Failed to start verification" }, { status: 500 })
    }

    // Simulate blockchain verification process
    setTimeout(async () => {
      await supabase
        .from("blockchain_transactions")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)
    }, 5000)

    return NextResponse.json({
      success: true,
      transactionHash,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error("Blockchain verify error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
