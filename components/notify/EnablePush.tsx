"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ENV } from "@/config/env"
import { subscribePush, unsubscribePush } from "@/lib/push-client"
import { Bell, BellOff } from "lucide-react"

export default function EnablePush() {
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    // Check if push notifications are supported
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    )

    // Check current permission status
    if (typeof window !== "undefined" && "Notification" in window) {
      setEnabled(Notification.permission === "granted")
    }
  }, [])

  async function onEnable() {
    try {
      setBusy(true)
      const sub = await subscribePush(ENV.PUBLIC_VAPID_KEY)
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      })
      setEnabled(true)
    } catch (e: any) {
      alert(e?.message || "Unable to enable push notifications")
    } finally {
      setBusy(false)
    }
  }

  async function onDisable() {
    setBusy(true)
    try {
      await unsubscribePush()
      await fetch("/api/push/unsubscribe", { method: "POST" })
      setEnabled(false)
    } finally {
      setBusy(false)
    }
  }

  if (!supported) {
    return (
      <Button variant="outline" disabled aria-label="Push notifications not supported">
        <BellOff className="h-4 w-4 mr-2" />
        Not Supported
      </Button>
    )
  }

  return enabled ? (
    <Button variant="outline" onClick={onDisable} disabled={busy} aria-label="Disable push notifications">
      <BellOff className="h-4 w-4 mr-2" />
      {busy ? "Disabling..." : "Disable Push"}
    </Button>
  ) : (
    <Button onClick={onEnable} disabled={busy} aria-label="Enable push notifications">
      <Bell className="h-4 w-4 mr-2" />
      {busy ? "Enabling..." : "Enable Push"}
    </Button>
  )
}
