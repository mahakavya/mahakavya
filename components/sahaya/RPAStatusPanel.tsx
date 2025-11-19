"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle } from "lucide-react"

export function RPAStatusPanel() {
  const [isOptimized, setIsOptimized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkRPAStatus = async () => {
      setIsLoading(true)
      try {
        // Simulate checking RPA status
        const response = await fetch("/api/sahaya/rpa-status")
        const data = await response.json()
        setIsOptimized(data.isOptimized)
      } catch (error) {
        console.error("Failed to check RPA status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkRPAStatus()
  }, [])

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOptimized ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-500" />
          )}
          RPA Automation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Checking RPA status...</p>
        ) : isOptimized ? (
          <p className="text-sm text-green-600">Automated and optimized</p>
        ) : (
          <p className="text-sm text-orange-600">Pending RPA optimization</p>
        )}
      </CardContent>
    </Card>
  )
}
