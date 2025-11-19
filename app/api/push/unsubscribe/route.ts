export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createSupabaseServerClient } from "@/lib/supabase"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const sb = createSupabaseServerClient()
    const {
      data: { session },
    } = await sb.auth.getSession()

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }

    const body = await req.json().catch(() => ({}))
    const { endpoint } = body

    let query = sb.from("push_subscriptions").delete().eq("user_id", session.user.id)

    if (endpoint) {
      query = query.eq("endpoint", endpoint)
    }

    const { count } = await query

    return new Response(JSON.stringify({ count: count || 0 }), {
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Push unsubscribe error:", error)
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
