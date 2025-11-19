"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"

interface Subscription {
  id: string
  user_id: string
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete"
  plan_id: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setSubscription(null)
      setLoading(false)
      return
    }

    fetchSubscription()
  }, [user])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/me")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }

      const data = await response.json()
      setSubscription(data.subscription)
    } catch (err) {
      console.error("Error fetching subscription:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const isActive = () => {
    if (!subscription) return false
    return subscription.status === "active" && new Date(subscription.current_period_end) > new Date()
  }

  const daysUntilExpiry = () => {
    if (!subscription || !isActive()) return 0
    const now = new Date()
    const expiry = new Date(subscription.current_period_end)
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return {
    subscription,
    loading,
    error,
    isActive: isActive(),
    daysUntilExpiry: daysUntilExpiry(),
    refetch: fetchSubscription,
  }
}
