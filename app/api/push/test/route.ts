export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createSupabaseServerClient } from "@/lib/supabase"
import { sendPushToUser } from "@/lib/push"
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
    const { url } = body

    const result = await sendPushToUser(sb, session.user.id, {
      title: "Mahakavya",
      body: "Push notifications are working!",
      url: url || "/",
      tag: "test",
    })

    return new Response(JSON.stringify(result), {
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Push test error:", error)
    return new Response(JSON.stringify({ error: "internal_error", sent: 0 }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
