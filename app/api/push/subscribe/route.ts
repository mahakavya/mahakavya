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

    const { endpoint, p256dh, auth } = await req.json()

    if (!endpoint || !p256dh || !auth) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    }

    // Upsert subscription
    await sb.from("push_subscriptions").upsert(
      {
        user_id: session.user.id,
        endpoint,
        p256dh,
        auth,
      },
      {
        onConflict: "endpoint",
      },
    )

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    })
  } catch (error) {
    console.error("Push subscribe error:", error)
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
