"use client"

import { useState, useEffect } from "react"
import { Check, CreditCard, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StatusPill } from "./StatusPill"
import { InvoiceRow } from "./InvoiceRow"
import { CancelDialog } from "./CancelDialog"
import { EmptyState } from "@/components/empty-state"
import { PaymentsTestNotice } from "@/components/pay/PaymentsTestNotice"
import { formatINR } from "@/lib/money"
import { formatIST, daysUntil } from "@/lib/dates"
import { MONTHLY_PRICE } from "@/config/payments"
import { useToast } from "@/hooks/use-toast"
import { loadRazorpay } from "@/lib/razorpay-client"
import type { Subscription, FeatureAccess } from "@/lib/types"

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  meta: {
    invoice_url?: string
    [key: string]: any
  }
}

interface BillingOverviewProps {
  subscription?: Subscription
  featureAccess?: FeatureAccess
}

export function BillingOverview({ subscription, featureAccess }: BillingOverviewProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()

  const isActive = subscription?.status === "active"
  const isPastDue = subscription?.status === "past_due"

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/billing/invoices")
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    }
  }

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

  const features = [
    { name: "Social Feed (Samvaaha)", enabled: featureAccess?.can_feed },
    { name: "Video Reels (Drishya)", enabled: featureAccess?.can_reels },
    { name: "Lucky Draw (BhagyaChakra)", enabled: featureAccess?.can_luckydraw },
    { name: "Fundraising (Nivedana)", enabled: featureAccess?.can_fundraising },
    { name: "Emotional Support (Sahaya)", enabled: featureAccess?.can_emotional },
  ]

  return (
    <div className="space-y-8" data-testid="billing-overview">
      <PaymentsTestNotice />

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Plan */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Mahakavya Monthly</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatINR(MONTHLY_PRICE)}
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </p>
              </div>
              <StatusPill status={subscription?.status || "canceled"} />
            </div>

            {isActive && subscription?.current_period_end && (
              <div className="text-sm text-gray-600">
                <p>
                  Renews on {formatIST(subscription.current_period_end)} ({daysUntil(subscription.current_period_end)}{" "}
                  days)
                </p>
              </div>
            )}

            {isPastDue && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment failed. Your subscription will be retried automatically. Update your payment method during the
                  next attempt.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-4">
              {isActive ? (
                <CancelDialog onCancel={() => window.location.reload()}>
                  <Button variant="outline" className="w-full bg-transparent">
                    Cancel at Period End
                  </Button>
                </CancelDialog>
              ) : (
                <Button className="w-full" onClick={handleSubscribe} disabled={isLoading || isPolling}>
                  {isLoading || isPolling ? "Processing..." : `Subscribe ${formatINR(MONTHLY_PRICE)}`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Your Access */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Your Access</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className={`h-4 w-4 flex-shrink-0 ${feature.enabled ? "text-green-600" : "text-gray-400"}`} />
                  <span className={feature.enabled ? "text-gray-900" : "text-gray-500"}>{feature.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No invoices yet"
              description="Your subscription invoices will appear here after billing."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
