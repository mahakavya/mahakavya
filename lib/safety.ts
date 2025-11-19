import { SAFETY } from "@/config/safety"

export type SafetyEntity = "post" | "reel" | "comment"

export function scoreContent(text: string) {
  const t = (text || "").toLowerCase()
  let score = 0
  const reasons: string[] = []

  // Check for profanity
  if (SAFETY.profanity.some((w) => t.includes(w))) {
    score += 0.6
    reasons.push("profanity")
  }

  // Check for spam links
  if (SAFETY.spamLinks.some((r) => r.test(t))) {
    score += 0.5
    reasons.push("spam-link")
  }

  // Check for mass mentions
  const mentions = (t.match(/@\w+/g) || []).length
  if (mentions > SAFETY.maxMentions) {
    score += 0.4
    reasons.push("mass-mention")
  }

  // Check for excessive caps (shouting)
  const capsRatio = (t.match(/[A-Z]/g) || []).length / Math.max(t.length, 1)
  if (capsRatio > 0.7 && t.length > 20) {
    score += 0.3
    reasons.push("excessive-caps")
  }

  // Check for repeated characters (spam pattern)
  if (/(.)\1{4,}/.test(t)) {
    score += 0.3
    reasons.push("spam-pattern")
  }

  return { score: Math.min(1, score), reasons }
}

export function actionForScore(score: number) {
  if (score >= SAFETY.autoHideScore) return "autohide"
  if (score >= SAFETY.flagScore) return "flag"
  return "allow"
}

export async function createSafetyFlag(
  sb: any,
  entityType: SafetyEntity,
  entityId: string,
  reason: string,
  score: number,
  createdBy?: string,
) {
  return sb
    .from("safety_flags")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
      score,
      created_by: createdBy || null,
    })
    .select("id")
    .single()
}
