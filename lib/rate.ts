type LimitArgs = {
  sb: any // Supabase server client
  route: string // e.g. "/api/feed/comment"
  windowMs: number // 60_000 (1 min)
  max: number // e.g. 20
  userId?: string | null
  ip?: string | null
}

/**
 * Records this attempt, then counts attempts in the window (including this one).
 * Throws {status:429, retryAfter:number} when exceeded.
 */
export async function assertWithinLimit({ sb, route, windowMs, max, userId, ip }: LimitArgs) {
  const nowIso = new Date().toISOString()
  const sinceIso = new Date(Date.now() - windowMs).toISOString()

  // record attempt (idempotency not required)
  await sb.from("rate_events").insert({ user_id: userId ?? null, ip: ip ?? null, route, created_at: nowIso })

  // count attempts in window for this principal (userId or IP)
  const filters = [
    `created_at.gte.${sinceIso}`,
    `route.eq.${route}`,
    userId ? `user_id.eq.${userId}` : `ip.eq.${ip ?? ""}`,
  ].join(",")

  const { count } = await sb.from("rate_events").select("*", { count: "exact", head: true }).or(filters)

  if ((count ?? 0) > max) {
    const err: any = new Error("Too many requests")
    err.status = 429
    err.retryAfter = Math.ceil(windowMs / 1000)
    throw err
  }
}

/** Helper to read client IP from request headers (Vercel/Proxy-safe). */
export function getClientIp(req: Request) {
  const raw = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || ""
  return raw.split(",")[0]?.trim() || null
}
