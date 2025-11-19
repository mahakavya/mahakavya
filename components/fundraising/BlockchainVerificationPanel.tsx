"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Shield, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react"

interface BlockchainRecord {
  id: string
  transactionHash: string
  blockNumber: number
  verificationStatus: "pending" | "confirmed" | "failed"
  gasUsed?: number
  transactionFee?: number
  verifiedAt?: string
  createdAt: string
}

interface BlockchainVerificationPanelProps {
  campaignId: string
  verified: boolean
}

export function BlockchainVerificationPanel({ campaignId, verified }: BlockchainVerificationPanelProps) {
  const [records, setRecords] = useState<BlockchainRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/blockchain-records`)
        if (response.ok) {
          const data = await response.json()
          setRecords(data.records || [])
        }
      } catch (error) {
        console.error("Failed to fetch blockchain records:", error)
      }
    }

    fetchRecords()
  }, [campaignId])

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch(`/api/fundraising/campaigns/${campaignId}/blockchain-verify`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setRecords((prev) => [data.record, ...prev])
        toast({
          title: "Verification initiated",
          description: "Blockchain verification has been started. This may take a few minutes.",
        })
      } else {
        throw new Error("Verification failed")
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Unable to start blockchain verification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Blockchain Verification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Verification Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Campaign Status</span>
            <Badge className={verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {verified ? "Verified" : "Unverified"}
            </Badge>
          </div>

          {/* Verify Button */}
          {!verified && (
            <Button onClick={handleVerify} disabled={isVerifying} className="w-full" size="sm">
              {isVerifying ? "Verifying..." : "Start Verification"}
            </Button>
          )}

          {/* Verification Records */}
          {records.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Verification History</h4>
              <div className="space-y-2">
                {records.slice(0, 3).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.verificationStatus)}
                      <div>
                        <div className="text-xs font-medium text-gray-900">Block #{record.blockNumber}</div>
                        <div className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(record.verificationStatus)} variant="secondary">
                        {record.verificationStatus}
                      </Badge>
                      {record.transactionHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://etherscan.io/tx/${record.transactionHash}`, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>✓ Immutable campaign record</p>
            <p>✓ Enhanced donor trust</p>
            <p>✓ Transparent fund tracking</p>
            <p>✓ Fraud prevention</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
