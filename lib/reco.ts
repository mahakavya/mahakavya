import { RECO } from "@/config/reco"

// Build a lightweight "interests" set from the viewer's last N interactions
export async function getUserInterests(sb: any, userId: string, limit = 200): Promise<string[]> {
  // From posts liked/commented or authored by the user recently
  const { data: liked } = await sb
    .from("post_likes")
    .select("post_id, posts(tags)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  const { data: commented } = await sb
    .from("post_comments")
    .select("post_id, posts(tags)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  const tags = new Set<string>()
  for (const row of [...(liked || []), ...(commented || [])]) {
    ;(row as any)?.posts?.tags?.forEach((t: string) => t && tags.add(t.toLowerCase()))
  }

  return Array.from(tags).slice(0, 50) // cap
}

export function recencyScore(ageHours: number) {
  // Exponential decay: score = 2^(-age/halfLife)
  const h = RECO.recencyHalfLifeH || 12
  return Math.pow(2, -ageHours / h)
}

export function engagementScore(likes6h: number, comments6h: number) {
  // Log smoothing (avoid whales); comments weigh slightly more
  const raw = likes6h + comments6h * 1.5
  return Math.log10(1 + raw) // 0..~something
}

export function tagScore(overlapCount: number) {
  // Map 0..5+ to 0..1 with soft cap
  const capped = Math.min(overlapCount, 5)
  return capped / 5
}
