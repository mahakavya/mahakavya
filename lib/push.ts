import webPush from "web-push"

const PUB = process.env.VAPID_PUBLIC_KEY!
const PRIV = process.env.VAPID_PRIVATE_KEY!
const SUBJ = process.env.VAPID_SUBJECT || "mailto:support@mahakavya.app"

let configured = false
export function ensureVapid() {
  if (!configured) {
    if (!PUB || !PRIV) throw new Error("VAPID env missing")
    webPush.setVapidDetails(SUBJ, PUB, PRIV)
    configured = true
  }
}

export type PushPayload = {
  title: string
  body?: string
  url?: string
  tag?: string
}

export async function sendPushToUser(sb: any, userId: string, payload: PushPayload) {
  ensureVapid()
  const { data: subs } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId)
  if (!subs?.length) return { sent: 0 }

  let sent = 0
  for (const s of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: s.endpoint,
          keys: { p256dh: s.p256dh, auth: s.auth },
        } as any,
        JSON.stringify(payload),
      )
      sent++
    } catch (e: any) {
      // Clean up stale subs
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await sb.from("push_subscriptions").delete().eq("id", s.id)
      }
    }
  }
  return { sent }
}
