"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/money"
import { INTRO_PRICE } from "@/config/payments"
import { loadRazorpay } from "@/lib/razorpay-client"

const introFeatures = [
  "Access to Feed (Samvaaha)",
  "Access to Reels (Drishya)",
  "Access to Lucky Draw (BhagyaChakra)",
  "Access to Fundraising (Nivedana)",
  "Access to Emotional Support (Sahaya)",
]

export function IntroPayCard() {
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const pollAccessStatus = async (): Promise<boolean> => {
    let attempts = 0
    const maxAttempts = 15 // 30 seconds with 2s intervals

    return new Promise((resolve) => {
      const poll = async () => {
        try {
          const response = await fetch("/api/me/access")
          if (response.ok) {
            const data = await response.json()
            if (data.feature_access?.intro_used) {
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

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Load Razorpay script
      await loadRazorpay()

      // Create order
      const clientTxnId = crypto.randomUUID()
      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientTxnId, kind: "intro" }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || "Failed to create order")
      }

      const { orderId, amount, currency, razorpayKey } = await orderResponse.json()

      // Open Razorpay Checkout
      const options = {
        key: razorpayKey, // Key comes from server
        order_id: orderId,
        amount,
        currency,
        name: "Mahakavya",
        description: "Introductory Access",
        theme: {
          color: "#f97316", // Orange color
        },
        handler: async (response: any) => {
          toast({
            title: "Payment Successful!",
            description: "Processing your access. Please wait...",
          })

          setIsPolling(true)
          const accessGranted = await pollAccessStatus()
          setIsPolling(false)

          if (accessGranted) {
            toast({
              title: "Welcome to Mahakavya!",
              description: "Your features have been unlocked successfully.",
            })
            router.push("/")
          } else {
            toast({
              title: "Payment Received",
              description: "Your access is being processed. Please refresh the page in a moment.",
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
      console.error("Payment failed:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass border-blue-200" data-testid="intro-pay-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5" />
          Intro Access Package
        </CardTitle>
        <div className="text-3xl font-bold text-gray-900 mt-2">{formatINR(INTRO_PRICE)}</div>
        <p className="text-gray-600">One-time payment</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">What you'll unlock:</h3>
          <ul className="space-y-2">
            {introFeatures.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button className="w-full" onClick={handlePayment} disabled={isLoading || isPolling}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isPolling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isPolling ? "Processing..." : `Pay ${formatINR(INTRO_PRICE)} to Start`}
        </Button>

        <div className="text-center text-sm text-gray-500">
          <p>Secure payment processing • 30-day money-back guarantee</p>
        </div>
      </CardContent>
    </Card>
  )
}
