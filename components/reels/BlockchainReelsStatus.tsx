"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface BlockchainReelsStatusProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  onVerify: () => void
}

interface BlockchainStatus {
  networkHealth: "healthy" | "degraded" | "offline"
  verifiedReels: number
  pendingVerifications: number
  lastBlockTime: string
  gasPrice: number
  transactionCount: number
}

export function BlockchainReelsStatus({ enabled, onToggle, onVerify }: BlockchainReelsStatusProps) {
  const [status, setStatus] = useState<BlockchainStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (enabled) {
      fetchStatus()
      const interval = setInterval(fetchStatus, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [enabled])

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/reels/blockchain-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch blockchain status:", error)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    try {
      await onVerify()
      await fetchStatus() // Refresh status after verification
      toast({
        title: "Verification Initiated",
        description: "Your reels are being verified on the blockchain.",
      })
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to initiate blockchain verification.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (!status) return <Clock className="h-4 w-4" />

    switch (status.networkHealth) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "offline":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    if (!status) return "secondary"

    switch (status.networkHealth) {
      case "healthy":
        return "default"
      case "degraded":
        return "secondary"
      case "offline":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!enabled)}
        className="flex items-center gap-1"
      >
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">Blockchain</span>
      </Button>

      {enabled && status && (
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="hidden sm:inline">{status.verifiedReels}</span>
          </Badge>

          {status.pendingVerifications > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {status.pendingVerifications}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleVerify}
            disabled={loading || status.networkHealth === "offline"}
            className="flex items-center gap-1"
          >
            <Shield className="h-4 w-4" />
            {loading ? "..." : "Verify"}
          </Button>
        </div>
      )}

      {enabled && !status && (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Connecting...</span>
        </div>
      )}
    </div>
  )
}
