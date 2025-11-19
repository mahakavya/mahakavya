"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CancelDialog } from "./CancelDialog"
import { useToast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/money"
import { formatIST, daysUntil } from "@/lib/dates"
import { MONTHLY_PRICE } from "@/config/payments"
import { loadRazorpay } from "@/lib/razorpay-client"
import type { Subscription } from "@/lib/types"

const monthlyFeatures = [
  "All intro features included",
  "Private messaging (Varta)",
  "Priority support",
  "Advanced features",
  "Community events access",
]

interface PlanCardProps {
  subscription?: Subscription
}

export function PlanCard({ subscription }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()

  const isActive = subscription?.status === "active"
  const isPastDue = subscription?.status === "past_due"

  const pollSubscriptionStatus = async (): Promise<boolean> => {
    let attempts = 0
    const maxAttempts = 15 // 30 seconds with 2s intervals

    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const response = await fetch("/api/me/access")
          if (response.ok) {
            const data = await response.json()
            if (data.subscription?.status === "active") {
              resolve(true)
              return
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }

        attempts++
        if (attempts >= maxAttempts) {
          resolve(false)
          return
        }

        setTimeout(poll, 2000)
      }

      poll()
    })
  }

  const handleSubscribe = async () => {
    setIsLoading(true)

    try {
      // Load Razorpay script
      await loadRazorpay()

      // Create subscription
      const subscribeResponse = await fetch("/api/billing/razorpay/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!subscribeResponse.ok) {
        const error = await subscribeResponse.json()
        throw new Error(error.error || "Failed to create subscription")
      }

      const { subscriptionId, razorpayKey } = await subscribeResponse.json()

      // Open Razorpay Checkout
      const options = {
        key: razorpayKey, // Key comes from server
        subscription_id: subscriptionId,
        name: "Mahakavya",
        description: "Monthly Subscription",
        theme: {
          color: "#f97316", // Orange color
        },
        handler: async (response: any) => {
          toast({
            title: "Subscription Activated!",
            description: "Processing your subscription. Please wait...",
          })

          setIsPolling(true)
          const subscriptionActive = await pollSubscriptionStatus()
          setIsPolling(false)

          if (subscriptionActive) {
            toast({
              title: "Welcome to Premium!",
              description: "Your subscription has been activated successfully.",
            })
            window.location.reload()
          } else {
            toast({
              title: "Subscription Created",
              description: "Your subscription is being processed. Please refresh the page in a moment.",
            })
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
          },
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error("Subscription failed:", error)
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle>Mahakavya Monthly</CardTitle>
          {isActive && <Badge className="bg-green-600">Active</Badge>}
          {isPastDue && <Badge variant="destructive">Past Due</Badge>}
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {formatINR(MONTHLY_PRICE)}
          <span className="text-lg font-normal text-gray-600">/month</span>
        </div>
        <p className="text-gray-600">Full access to all features</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Premium Benefits:</h3>
          <ul className="space-y-2">
            {monthlyFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {isActive ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <p className="text-green-600 font-medium">✓ Subscription Active</p>
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-600 mt-1">
                  Next billing: {formatIST(subscription.current_period_end)} (
                  {daysUntil(subscription.current_period_end)} days)
                </p>
              )}
            </div>
            <CancelDialog onCancel={() => window.location.reload()}>
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Cancel at period end
              </Button>
            </CancelDialog>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubscribe}
            disabled={isLoading || isPolling}
            variant={isPastDue ? "destructive" : "default"}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPolling ? "Processing..." : isPastDue ? "Reactivate Subscription" : "Subscribe Now"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
