"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PaymentsTestNotice() {
  // Simple client-side check for development mode
  const isTestMode = process.env.NODE_ENV === "development"

  if (!isTestMode) return null

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <strong>Test Mode:</strong> This is a development environment. No real payments will be processed.
      </AlertDescription>
    </Alert>
  )
}
