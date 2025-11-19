"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/money"
import { Heart, CreditCard } from "lucide-react"
import { loadRazorpay } from "@/lib/razorpay-client"

interface DonationModalProps {
  campaignId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hasAccess: boolean
  onDonationSuccess?: (amount: number) => void
}

const quickAmounts = [100, 251, 501, 1001]

export function DonationModal({ campaignId, open, onOpenChange, hasAccess, onDonationSuccess }: DonationModalProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (!hasAccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl"
          data-testid="donation-modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Support This Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Access Required:</strong> You need to complete the intro payment or have an active subscription
                to make donations.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onOpenChange(false)
                  window.location.href = "/onboarding/pay-intro"
                }}
                className="flex-1"
              >
                Complete Intro Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  window.location.href = "/billing"
                }}
                className="flex-1"
              >
                View Subscription
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString())
  }

  const handleDonate = async () => {
    const donationAmount = Number.parseInt(amount)

    if (!donationAmount || donationAmount < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum donation amount is ₹10.",
        variant: "destructive",
      })
      return
    }

    if (donationAmount > 1000000) {
      toast({
        title: "Amount too large",
        description: "Maximum donation amount is ₹10 lakhs.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Create donation order
      const clientTxnId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

      const response = await fetch("/api/fundraising/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: donationAmount,
          clientTxnId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create donation")
      }

      const { orderId, amount: orderAmount, currency, razorpayKey } = await response.json()

      // Load Razorpay script
      await loadRazorpay()

      // Open Razorpay Checkout
      const razorpay = new (window as any).Razorpay({
        key: razorpayKey, // Key comes from server
        order_id: orderId,
        amount: orderAmount * 100,
        currency,
        name: "Mahakavya — Donation",
        description: "Support this fundraising campaign",
        theme: {
          color: "#ff6a00",
        },
        handler: (response: any) => {
          toast({
            title: "Donation successful!",
            description: `Thank you for donating ${formatINR(orderAmount)} to this campaign.`,
          })

          // Optimistically update the UI
          if (onDonationSuccess) {
            onDonationSuccess(orderAmount)
          }

          onOpenChange(false)
          setAmount("")
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
          },
        },
      })

      razorpay.open()
    } catch (error) {
      toast({
        title: "Donation failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl"
        data-testid="donation-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support This Campaign
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="amount">Donation Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="10"
              max="1000000"
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">Minimum: ₹10 • Maximum: ₹10 lakhs</div>
          </div>

          <div>
            <Label className="text-sm font-medium">Quick Amounts</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={amount === quickAmount.toString() ? "border-orange-500 bg-orange-50" : ""}
                >
                  {formatINR(quickAmount)}
                </Button>
              ))}
            </div>
          </div>

          {amount && Number.parseInt(amount) >= 10 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Your donation:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {formatINR(Number.parseInt(amount))}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleDonate}
              disabled={isLoading || !amount || Number.parseInt(amount) < 10}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? "Processing..." : `Donate ${amount ? formatINR(Number.parseInt(amount)) : ""}`}
            </Button>

            <div className="text-xs text-gray-500 text-center">Secure payment powered by Razorpay</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
