"use client"

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i)
  return out
}

export async function ensureSWRegistered() {
  if (typeof window === "undefined") return null
  if (!("serviceWorker" in navigator)) return null
  return navigator.serviceWorker.register("/sw.js")
}

export async function subscribePush(publicKey: string) {
  const reg = await ensureSWRegistered()
  if (!reg) throw new Error("Service worker not available")
  const perm = await Notification.requestPermission()
  if (perm !== "granted") throw new Error("Permission denied")

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(publicKey),
  })
  const json = sub.toJSON() as any
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  }
}

export async function unsubscribePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
  return !!sub
}
