"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, AlertTriangle, Shield, Zap, CheckCircle, DollarSign } from "lucide-react"

interface PaymentData {
  id: string
  amount: number
  currency: string
  status: "pending" | "completed" | "failed" | "flagged"
  timestamp: string
  userId: string
  method: string
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})

  useEffect(() => {
    // Simulate fetching payment data
    const mockPayments: PaymentData[] = [
      {
        id: "pay_1",
        amount: 299,
        currency: "INR",
        status: "pending",
        timestamp: new Date().toISOString(),
        userId: "user_123",
        method: "razorpay",
      },
      {
        id: "pay_2",
        amount: 599,
        currency: "INR",
        status: "completed",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: "user_456",
        method: "razorpay",
      },
      {
        id: "pay_3",
        amount: 1299,
        currency: "INR",
        status: "flagged",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        userId: "user_789",
        method: "razorpay",
      },
    ]

    setPayments(mockPayments)
    setLoading(false)
  }, [])

  const detectFraudulentTransactions = async (paymentData: PaymentData) => {
    // Simulate AI fraud detection
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple fraud detection logic
    const isFraudulent = paymentData.amount > 1000 || Math.random() < 0.1
    return isFraudulent
  }

  const verifyBlockchainPayment = async (paymentData: PaymentData) => {
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return {
      verified: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 8)}`,
      blockNumber: Math.floor(Math.random() * 1000000),
    }
  }

  const automatePaymentProcessing = async (paymentData: PaymentData) => {
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      processed: true,
      automationId: `rpa_${Date.now()}`,
    }
  }

  const handlePayment = async (payment: PaymentData) => {
    setProcessing(payment.id)

    try {
      // Step 1: Detect fraudulent transactions
      const isFraudulent = await detectFraudulentTransactions(payment)
      if (isFraudulent) {
        setResults((prev) => ({
          ...prev,
          [payment.id]: "❌ Fraudulent transaction detected - Payment blocked",
        }))

        // Update payment status
        setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: "failed" } : p)))
        return
      }

      // Step 2: Blockchain verification
      const verification = await verifyBlockchainPayment(payment)
      if (!verification.verified) {
        setResults((prev) => ({
          ...prev,
          [payment.id]: "🔒 Blockchain verification failed",
        }))
        return
      }

      // Step 3: RPA automation
      const automation = await automatePaymentProcessing(payment)

      setResults((prev) => ({
        ...prev,
        [payment.id]: `✅ Payment processed successfully!
        
Verification Hash: ${verification.transactionHash}
Block Number: ${verification.blockNumber}
Automation ID: ${automation.automationId}`,
      }))

      // Update payment status
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: "completed" } : p)))
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [payment.id]: "❌ Payment processing failed",
      }))
    } finally {
      setProcessing(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "flagged":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CreditCard className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default" as const,
      failed: "destructive" as const,
      flagged: "secondary" as const,
      pending: "outline" as const,
    }
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Management</h1>
          <p className="text-gray-600">AI fraud detection, blockchain verification, and RPA automation</p>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Flagged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payments.filter((p) => p.status === "flagged").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payments.filter((p) => p.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Payment transactions with AI fraud detection and blockchain verification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="font-medium">
                        ₹{payment.amount} {payment.currency}
                      </div>
                      <div className="text-sm text-gray-600">
                        {payment.method} • {payment.userId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(payment.status)}
                    <div className="text-xs text-gray-500 mt-1">{new Date(payment.timestamp).toLocaleString()}</div>
                  </div>
                </div>

                {payment.status === "pending" && (
                  <Button
                    onClick={() => handlePayment(payment)}
                    disabled={processing === payment.id}
                    className="w-full"
                  >
                    {processing === payment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Process Payment
                      </>
                    )}
                  </Button>
                )}

                {results[payment.id] && (
                  <Alert>
                    <AlertDescription className="whitespace-pre-line">{results[payment.id]}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Processing Pipeline</CardTitle>
          <CardDescription>How our AI + Blockchain + RPA payment system works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">AI Fraud Detection</h3>
              <p className="text-sm text-gray-600">Machine learning algorithms detect suspicious transactions</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Blockchain Verification</h3>
              <p className="text-sm text-gray-600">Transactions are verified and recorded on blockchain</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">RPA Automation</h3>
              <p className="text-sm text-gray-600">Automated workflows handle payment processing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
