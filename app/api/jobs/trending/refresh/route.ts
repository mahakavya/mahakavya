export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createSupabaseServerClient } from "@/lib/supabase"

export async function POST() {
  try {
    const sb = createSupabaseServerClient()

    // This should be called by admin or service role only
    // For now, we'll skip auth check but add a comment
    // TODO: Add proper service role authentication

    // Refresh the materialized view
    await sb.rpc("refresh_trending")

    return Response.json({ ok: true })
  } catch (error) {
    console.error("Trending refresh error:", error)
    return Response.json({ error: "Failed to refresh trending data" }, { status: 500 })
  }
}
