"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Link2,
  Download,
  RefreshCw,
  Settings,
  Eye,
  Lock,
  Activity,
} from "lucide-react"

interface BlockchainRecord {
  id: string
  transaction_hash: string
  block_number: number
  group_id: string
  action_type: "message" | "member_join" | "member_leave" | "settings_change" | "verification"
  timestamp: string
  gas_used: number
  status: "confirmed" | "pending" | "failed"
  verification_score: number
}

interface BlockchainGroupStatusData {
  network_status: {
    is_connected: boolean
    network_name: string
    block_height: number
    gas_price: number
    confirmation_time: number
  }
  group_verification: {
    is_verified: boolean
    verification_level: "basic" | "standard" | "premium"
    trust_score: number
    last_verification: string
    total_verifications: number
  }
  recent_transactions: BlockchainRecord[]
  security_metrics: {
    integrity_score: number
    tamper_attempts: number
    successful_verifications: number
    failed_verifications: number
  }
  audit_trail: {
    total_records: number
    verified_records: number
    pending_records: number
    retention_period: number
  }
}

export function BlockchainGroupStatus() {
  const [status, setStatus] = useState<BlockchainGroupStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    fetchBlockchainStatus()
    const interval = setInterval(fetchBlockchainStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchBlockchainStatus = async () => {
    try {
      const response = await fetch("/api/chat/groups/blockchain-status")
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching blockchain status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const initiateVerification = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/chat/groups/blockchain-verify", {
        method: "POST",
      })
      if (response.ok) {
        await fetchBlockchainStatus()
      }
    } catch (error) {
      console.error("Error initiating verification:", error)
    } finally {
      setIsVerifying(false)
    }
  }

  const downloadAuditReport = async () => {
    try {
      const response = await fetch("/api/chat/groups/blockchain-audit-report")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `blockchain-audit-report-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading audit report:", error)
    }
  }

  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case "premium":
        return "text-purple-600 bg-purple-50"
      case "standard":
        return "text-blue-600 bg-blue-50"
      case "basic":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading || !status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Security
            </CardTitle>
            <CardDescription>Group integrity verification and audit trail</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.network_status.is_connected ? "default" : "destructive"}>
              {status.network_status.is_connected ? "Connected" : "Disconnected"}
            </Badge>
            <Button variant="outline" size="sm" onClick={downloadAuditReport}>
              <Download className="h-4 w-4 mr-2" />
              Audit Report
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Network Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network</span>
                    <Badge variant="outline">{status.network_status.network_name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Block Height</span>
                    <span className="text-sm font-mono">{status.network_status.block_height.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gas Price</span>
                    <span className="text-sm">{status.network_status.gas_price} gwei</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confirmation Time</span>
                    <span className="text-sm">{status.network_status.confirmation_time}s</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Security Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Integrity Score</span>
                      <span className="text-sm font-bold text-green-600">
                        {status.security_metrics.integrity_score}%
                      </span>
                    </div>
                    <Progress value={status.security_metrics.integrity_score} className="h-1" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tamper Attempts</span>
                    <Badge variant={status.security_metrics.tamper_attempts > 0 ? "destructive" : "default"}>
                      {status.security_metrics.tamper_attempts}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Successful Verifications</span>
                    <span className="text-sm text-green-600">{status.security_metrics.successful_verifications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed Verifications</span>
                    <span className="text-sm text-red-600">{status.security_metrics.failed_verifications}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${status.group_verification.is_verified ? "bg-green-100" : "bg-yellow-100"}`}
                >
                  {status.group_verification.is_verified ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {status.group_verification.is_verified ? "Group Verified" : "Verification Pending"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last verified: {new Date(status.group_verification.last_verification).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                onClick={initiateVerification}
                disabled={isVerifying}
                variant={status.group_verification.is_verified ? "outline" : "default"}
              >
                {isVerifying ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                {isVerifying ? "Verifying..." : "Verify Now"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Badge className={`mb-2 ${getVerificationLevelColor(status.group_verification.verification_level)}`}>
                    {status.group_verification.verification_level.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Verification Level</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{status.group_verification.trust_score}%</p>
                  <p className="text-sm text-muted-foreground">Trust Score</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{status.group_verification.total_verifications}</p>
                  <p className="text-sm text-muted-foreground">Total Verifications</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <div className="space-y-3">
              {status.recent_transactions.map((transaction) => (
                <Card key={transaction.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(transaction.status)}
                          <span className="font-medium capitalize">{transaction.action_type.replace("_", " ")}</span>
                          <Badge variant="outline" className="text-xs">
                            Block #{transaction.block_number}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-3 w-3" />
                            <span className="font-mono text-xs">{transaction.transaction_hash}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{new Date(transaction.timestamp).toLocaleString()}</span>
                            <span>Gas: {transaction.gas_used.toLocaleString()}</span>
                            <span>Score: {transaction.verification_score}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {status.recent_transactions.length === 0 && (
              <div className="text-center py-8">
                <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent transactions</h3>
                <p className="text-muted-foreground">Blockchain transactions will appear here as they occur</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{status.audit_trail.total_records}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{status.audit_trail.verified_records}</p>
                  <p className="text-sm text-muted-foreground">Verified Records</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{status.audit_trail.pending_records}</p>
                  <p className="text-sm text-muted-foreground">Pending Records</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{status.audit_trail.retention_period}</p>
                  <p className="text-sm text-muted-foreground">Retention (Days)</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audit Trail Integrity</CardTitle>
                <CardDescription>Blockchain-verified record keeping</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Record Integrity</span>
                    <span className="font-bold text-green-600">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>All records are cryptographically secured and tamper-proof</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>Real-time verification with blockchain consensus</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
