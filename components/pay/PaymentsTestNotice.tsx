"use client"

import { AlertTriangle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isRazorpayTestMode } from "@/config/env"

export function PaymentsTestNotice() {
  if (!isRazorpayTestMode) return null

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <strong>TEST MODE:</strong> You are in Razorpay test mode. Use{" "}
        <a
          href="https://razorpay.com/docs/payments/payments/test-card-upi-details/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:no-underline"
        >
          test cards
          <ExternalLink className="h-3 w-3" />
        </a>{" "}
        for testing payments.
      </AlertDescription>
    </Alert>
  )
}
