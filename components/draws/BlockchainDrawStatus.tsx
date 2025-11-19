"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BlockchainStatus {
  isVerified: boolean
  verificationHash: string
  lastVerification: string
  totalTransactions: number
  securityScore: number
  networkStatus: "online" | "maintenance" | "offline"
  recentTransactions: Array<{
    id: string
    type: string
    timestamp: string
    status: "confirmed" | "pending" | "failed"
    hash: string
  }>
}

export function BlockchainDrawStatus() {
  const [status, setStatus] = useState<BlockchainStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/draws/blockchain-status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch blockchain status")
      }

      setStatus(data)
    } catch (error) {
      console.error("Failed to fetch blockchain status:", error)
      toast({
        title: "Error",
        description: "Failed to load blockchain status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchStatus()
    toast({
      title: "Refreshed!",
      description: "Blockchain status updated",
    })
  }

  const getNetworkStatusColor = () => {
    if (!status) return "bg-gray-100 text-gray-800"
    switch (status.networkStatus) {
      case "online":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSecurityScoreColor = () => {
    if (!status) return "text-gray-600"
    if (status.securityScore >= 90) return "text-green-600"
    if (status.securityScore >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-blue-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-blue-200 rounded"></div>
              <div className="h-16 bg-blue-200 rounded"></div>
              <div className="h-16 bg-blue-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) return null

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Shield className="h-5 w-5" />
            Blockchain Security Status
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Premium
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-blue-200 hover:bg-blue-50 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              {status.isVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700">Verification Status</span>
            </div>
            <div className={`text-lg font-bold ${status.isVerified ? "text-green-600" : "text-red-600"}`}>
              {status.isVerified ? "Verified" : "Pending"}
            </div>
            <div className="text-xs text-gray-500">Last: {new Date(status.lastVerification).toLocaleString()}</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getNetworkStatusColor()}>{status.networkStatus.toUpperCase()}</Badge>
              <span className="text-sm font-medium text-gray-700">Network</span>
            </div>
            <div className="text-lg font-bold text-blue-600">{status.totalTransactions}</div>
            <div className="text-xs text-gray-500">Total transactions</div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Security Score</span>
            </div>
            <div className={`text-lg font-bold ${getSecurityScoreColor()}`}>{status.securityScore}/100</div>
            <div className="text-xs text-gray-500">Platform security</div>
          </div>
        </div>

        {/* Verification Hash */}
        {status.verificationHash && (
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-2">🔐 Verification Hash</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 p-2 rounded text-xs font-mono break-all">
                {status.verificationHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(status.verificationHash)
                  toast({ title: "Copied!", description: "Hash copied to clipboard" })
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">⛓️ Recent Transactions</h4>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
              <ExternalLink className="h-4 w-4 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {status.recentTransactions.slice(0, 3).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {tx.status === "confirmed" && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {tx.status === "pending" && <Clock className="h-3 w-3 text-yellow-500" />}
                    {tx.status === "failed" && <AlertCircle className="h-3 w-3 text-red-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                    <div className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    tx.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : tx.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }
                >
                  {tx.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
