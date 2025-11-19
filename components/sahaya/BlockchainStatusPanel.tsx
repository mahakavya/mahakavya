"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, ShieldAlert } from "lucide-react"

export function BlockchainStatusPanel() {
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkBlockchainStatus = async () => {
      setIsLoading(true)
      try {
        // Simulate checking blockchain status
        const response = await fetch("/api/sahaya/blockchain-status")
        const data = await response.json()
        setIsVerified(data.isVerified)
      } catch (error) {
        console.error("Failed to check blockchain status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkBlockchainStatus()
  }, [])

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isVerified ? (
            <ShieldCheck className="h-4 w-4 text-green-500" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          )}
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Checking blockchain status...</p>
        ) : isVerified ? (
          <p className="text-sm text-green-600">Verified by blockchain</p>
        ) : (
          <p className="text-sm text-orange-600">Pending blockchain verification</p>
        )}
      </CardContent>
    </Card>
  )
}
