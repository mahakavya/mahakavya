"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { monitoring } from "@/lib/monitoring"

interface BlockchainStatusProps {
  status: {
    verifiedPosts: number
    pendingVerifications: number
    integrityScore: number
    lastVerification: string
    networkStatus: "healthy" | "degraded" | "offline"
    recentTransactions: Array<{
      id: string
      type: string
      status: "confirmed" | "pending" | "failed"
      timestamp: string
    }>
  }
}

export function BlockchainStatus({ status }: BlockchainStatusProps) {
  const { user } = useAuth()

  const handleVerifyContent = async () => {
    try {
      const response = await fetch("/api/blockchain/verify-user-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })

      if (response.ok) {
        monitoring.logUserAction(
          "blockchain_verification_requested",
          {
            verifiedPosts: status.verifiedPosts,
            pendingVerifications: status.pendingVerifications,
          },
          user?.id,
        )
      }
    } catch (error) {
      console.error("Failed to verify content:", error)
    }
  }

  const getNetworkStatusColor = (networkStatus: string) => {
    switch (networkStatus) {
      case "healthy":
        return "text-green-600 bg-green-100"
      case "degraded":
        return "text-yellow-600 bg-yellow-100"
      case "offline":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getTransactionStatusIcon = (transactionStatus: string) => {
    switch (transactionStatus) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-600" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-600" />
      default:
        return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  return (
    <Card className="heritage-card border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span>Blockchain Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-900">Network</span>
          <Badge className={getNetworkStatusColor(status.networkStatus)}>
            {status.networkStatus.charAt(0).toUpperCase() + status.networkStatus.slice(1)}
          </Badge>
        </div>

        {/* Verification Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-50/50 text-center">
            <div className="text-lg font-bold text-green-900">{status.verifiedPosts}</div>
            <div className="text-xs text-green-600">Verified Posts</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50/50 text-center">
            <div className="text-lg font-bold text-yellow-900">{status.pendingVerifications}</div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
        </div>

        {/* Integrity Score */}
        <div className="p-3 rounded-lg bg-green-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Integrity Score</span>
            <Badge className="text-green-600 bg-green-100">{status.integrityScore}%</Badge>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.integrityScore}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h4 className="text-sm font-medium text-green-900 mb-2">Recent Transactions</h4>
          <div className="space-y-2">
            {status.recentTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-2 rounded bg-green-50/50">
                <div className="flex items-center space-x-2">
                  {getTransactionStatusIcon(transaction.status)}
                  <span className="text-sm text-green-900 capitalize">{transaction.type}</span>
                </div>
                <span className="text-xs text-green-600">{new Date(transaction.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Verification */}
        <div className="text-xs text-green-600">
          Last verification: {new Date(status.lastVerification).toLocaleString()}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-green-600 border-green-200 hover:bg-green-50 bg-transparent"
          onClick={handleVerifyContent}
        >
          Verify My Content
        </Button>
      </CardContent>
    </Card>
  )
}
