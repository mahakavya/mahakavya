"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase"

interface AdminRealtimeOptions {
  onReport?: (report: any) => void
  onPayment?: (payment: any) => void
}

export function useAdminRealtime({ onReport, onPayment }: AdminRealtimeOptions) {
  useEffect(() => {
    const sb = createClient()

    const channels: any[] = []

    // Subscribe to reports
    if (onReport) {
      const reportsChannel = sb
        .channel("admin-reports")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reports",
          },
          (payload) => {
            onReport(payload.new || payload.old)
          },
        )
        .subscribe()

      channels.push(reportsChannel)
    }

    // Subscribe to payments
    if (onPayment) {
      const paymentsChannel = sb
        .channel("admin-payments")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "payments",
          },
          (payload) => {
            onPayment(payload.new || payload.old)
          },
        )
        .subscribe()

      channels.push(paymentsChannel)
    }

    return () => {
      channels.forEach((channel) => sb.removeChannel(channel))
    }
  }, [onReport, onPayment])
}
