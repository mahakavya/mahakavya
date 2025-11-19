"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

interface ProgressBadgeProps {
  reelId: string
  onComplete?: () => void
}

export function ProgressBadge({ reelId, onComplete }: ProgressBadgeProps) {
  const [status, setStatus] = useState<"PROCESSING" | "READY" | "FAILED">("PROCESSING")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/drishya/reels/${reelId}/status`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data.status)
          setProgress(data.progress || 0)

          if (data.status === "READY") {
            onComplete?.()
          }
        }
      } catch (error) {
        console.error("Failed to check reel status:", error)
      }
    }

    // Check status immediately
    checkStatus()

    // Poll for updates every 2 seconds while processing
    const interval = setInterval(() => {
      if (status === "PROCESSING") {
        checkStatus()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [reelId, status, onComplete])

  const getStatusIcon = () => {
    switch (status) {
      case "PROCESSING":
        return <Clock className="w-3 h-3 animate-pulse" />
      case "READY":
        return <CheckCircle className="w-3 h-3" />
      case "FAILED":
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "PROCESSING":
        return `Processing... ${progress}%`
      case "READY":
        return "Ready"
      case "FAILED":
        return "Failed"
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "PROCESSING":
        return "bg-blue-600"
      case "READY":
        return "bg-green-600"
      case "FAILED":
        return "bg-red-600"
    }
  }

  return (
    <Badge className={`${getStatusColor()} text-white flex items-center space-x-1`}>
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </Badge>
  )
}
