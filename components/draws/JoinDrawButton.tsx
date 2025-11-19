"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IndianRupee, Loader2 } from "lucide-react"
import { formatINR } from "@/lib/money"
import { useToast } from "@/hooks/use-toast"
import { AccessGate } from "@/components/access-gate"
import { loadRazorpay } from "@/lib/razorpay-client"

interface JoinDrawButtonProps {
  drawId: string
  ticketPrice: number
  drawAt: string
  status: string
  disabled?: boolean
  onSuccess?: () => void
}

export function JoinDrawButton({ drawId, ticketPrice, drawAt, status, disabled, onSuccess }: JoinDrawButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const isDisabled = disabled || status !== "upcoming" || new Date() >= new Date(drawAt) || isLoading

  const handleJoin = async () => {
    if (isDisabled) return

    setIsLoading(true)

    try {
      const clientTxnId = `draw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const response = await fetch("/api/draws/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawId,
          clientTxnId: ticketPrice > 0 ? clientTxnId : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join draw")
      }

      // Handle free entry
      if (ticketPrice === 0) {
        toast({
          title: "Success!",
          description: "You have successfully joined the draw.",
        })
        onSuccess?.()
        return
      }

      // Handle paid entry with Razorpay
      await loadRazorpay()

      const options = {
        key: data.razorpayKey, // Key comes from server
        amount: data.amount * 100,
        currency: data.currency,
        order_id: data.orderId,
        name: "Mahakavya — Draw Ticket",
        description: "Lucky Draw Entry",
        theme: {
          color: "#ff6a00",
        },
        handler: (response: any) => {
          toast({
            title: "Payment Successful!",
            description: "Your draw entry is being processed.",
          })
          onSuccess?.()
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Join draw error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join draw",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AccessGate feature="luckydraw">
      <Button onClick={handleJoin} disabled={isDisabled} className="w-full" size="lg">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {ticketPrice === 0 ? (
          "Join Draw (Free)"
        ) : (
          <div className="flex items-center gap-1">
            <span>Join Draw</span>
            <IndianRupee className="h-4 w-4" />
            <span>{formatINR(ticketPrice)}</span>
          </div>
        )}
      </Button>
    </AccessGate>
  )
}
