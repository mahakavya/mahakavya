"use client"

import type React from "react"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface CancelDialogProps {
  children: React.ReactNode
  onCancel?: () => void
}

export function CancelDialog({ children, onCancel }: CancelDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/billing/razorpay/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelAtCycleEnd: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel subscription")
      }

      toast({
        title: "Subscription Canceled",
        description: "Your subscription will end at the current billing period.",
      })

      setIsOpen(false)
      onCancel?.()
    } catch (error) {
      console.error("Cancel subscription failed:", error)
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent data-testid="cancel-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your
            current billing period.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>What happens next:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Your subscription will remain active until the current period ends</li>
              <li>• You won't be charged for the next billing cycle</li>
              <li>• You can reactivate anytime before the period ends</li>
              <li>• After cancellation, you'll lose access to premium features</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel at Period End
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
