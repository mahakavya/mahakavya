"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Oops! Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>
            {error.digest && (
              <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>If this problem persists, please contact our support team.</p>
            <Link href="/help" className="text-orange-600 hover:text-orange-700 underline">
              Get Help
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
