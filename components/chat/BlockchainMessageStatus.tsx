"use client"

import { useState, useEffect } from "react"
import { Shield, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

interface BlockchainRecord {
  id: string
  messageId: string
  transactionHash: string
  blockNumber: number
  verificationStatus: "verified" | "pending" | "failed"
  integrityHash: string
  timestamp: string
  gasUsed?: number
  confirmations?: number
}

interface BlockchainMetrics {
  totalVerified: number
  pendingVerification: number
  integrityScore: number
  networkHealth: "excellent" | "good" | "fair" | "poor"
  averageConfirmationTime: string
  gasPrice: number
}

export function BlockchainMessageStatus() {
  const [records, setRecords] = useState<BlockchainRecord[]>([])
  const [metrics, setMetrics] = useState<BlockchainMetrics>({
    totalVerified: 0,
    pendingVerification: 0,
    integrityScore: 0,
    networkHealth: "excellent",
    averageConfirmationTime: "0s",
    gasPrice: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBlockchainStatus = async () => {
      try {
        const response = await fetch("/api/chat/blockchain-status")
        if (response.ok) {
          const data = await response.json()
          setRecords(data.records || [])
          setMetrics(data.metrics || metrics)
        }
      } catch (error) {
        console.error("Error loading blockchain status:", error)
        // Set mock data for demonstration
        setRecords([
          {
            id: "1",
            messageId: "msg_123",
            transactionHash: "0x1234567890abcdef1234567890abcdef12345678",
            blockNumber: 18500234,
            verificationStatus: "verified",
            integrityHash: "sha256:abc123def456...",
            timestamp: new Date(Date.now() - 300000).toISOString(),
            gasUsed: 21000,
            confirmations: 12,
          },
          {
            id: "2",
            messageId: "msg_124",
            transactionHash: "0xabcdef1234567890abcdef1234567890abcdef12",
            blockNumber: 18500235,
            verificationStatus: "pending",
            integrityHash: "sha256:def456ghi789...",
            timestamp: new Date(Date.now() - 120000).toISOString(),
            gasUsed: 21000,
            confirmations: 3,
          },
        ])
        setMetrics({
          totalVerified: 1247,
          pendingVerification: 3,
          integrityScore: 99.2,
          networkHealth: "excellent",
          averageConfirmationTime: "2.3s",
          gasPrice: 15.2,
        })
      } finally {
        setLoading(false)
      }
    }

    loadBlockchainStatus()
    const interval = setInterval(loadBlockchainStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getNetworkHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "fair":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield className="w-5 h-5 mr-2 text-green-600" />
          Blockchain Security
        </h3>
        <Badge variant="outline" className={getNetworkHealthColor(metrics.networkHealth)}>
          {metrics.networkHealth}
        </Badge>
      </div>

      {/* Blockchain Metrics Overview */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Network Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Verified Messages</div>
              <div className="font-semibold text-green-600">{metrics.totalVerified}</div>
            </div>
            <div>
              <div className="text-gray-600">Pending</div>
              <div className="font-semibold text-yellow-600">{metrics.pendingVerification}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Confirmation</div>
              <div className="font-semibold text-blue-600">{metrics.averageConfirmationTime}</div>
            </div>
            <div>
              <div className="text-gray-600">Gas Price</div>
              <div className="font-semibold text-purple-600">{metrics.gasPrice} gwei</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Integrity Score</span>
              <span className="font-semibold">{metrics.integrityScore}%</span>
            </div>
            <Progress value={metrics.integrityScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Blockchain Records */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Recent Verifications</h4>
        {records.map((record) => (
          <Card key={record.id} className="bg-white/40 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(record.verificationStatus)}
                  <div>
                    <div className="font-medium text-sm">Block #{record.blockNumber}</div>
                    <div className="text-xs text-gray-500">{truncateHash(record.transactionHash)}</div>
                  </div>
                </div>
                <Badge variant={record.verificationStatus === "verified" ? "default" : "secondary"} className="text-xs">
                  {record.verificationStatus}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-gray-600 mb-3">
                <div>Gas Used: {record.gasUsed?.toLocaleString()}</div>
                <div>Confirmations: {record.confirmations}</div>
                <div>Hash: {truncateHash(record.integrityHash)}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleString()}</span>
                <Button size="sm" variant="outline" className="text-xs bg-transparent">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View on Explorer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verification Actions */}
      <Card className="bg-white/40 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Verification Actions</CardTitle>
          <CardDescription className="text-xs">Manage blockchain verification for your messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            Verify All Recent Messages
          </Button>
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            Download Verification Certificate
          </Button>
          <Button size="sm" variant="outline" className="w-full text-xs bg-transparent">
            View Full Audit Trail
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
