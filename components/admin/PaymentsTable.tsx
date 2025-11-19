"use client"

import { useState, useEffect } from "react"
import { DataTable } from "./DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { formatIST } from "@/lib/dates"
import { formatINR } from "@/lib/money"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  payment_id: string
  order_id: string
  created_at: string
  meta: any
  profiles: { name: string; email: string }
}

export function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterKind, setFilterKind] = useState("all")
  const { toast } = useToast()

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterKind !== "all") params.set("kind", filterKind)

      const response = await fetch(`/api/admin/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.items)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [filterStatus, filterKind])

  const handleRefund = async (paymentId: string) => {
    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment refunded successfully",
        })
        fetchPayments()
      } else {
        throw new Error("Failed to refund payment")
      }
    } catch (error) {
      console.error("Error refunding payment:", error)
      toast({
        title: "Error",
        description: "Failed to refund payment",
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      key: "created_at",
      label: "Date",
      render: (value: string) => formatIST(value),
    },
    {
      key: "amount",
      label: "Amount",
      render: (value: number, row: Payment) => formatINR(value),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge
          variant={
            value === "captured"
              ? "default"
              : value === "failed"
                ? "destructive"
                : value === "refunded"
                  ? "secondary"
                  : "outline"
          }
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "meta",
      label: "Kind",
      render: (value: any) => <Badge variant="outline">{value?.kind || "unknown"}</Badge>,
    },
    {
      key: "profiles",
      label: "User",
      render: (value: any) => value?.name || "Unknown",
    },
    {
      key: "payment_id",
      label: "Payment ID",
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value?.slice(0, 12)}...</code>
      ),
    },
    {
      key: "order_id",
      label: "Order ID",
      render: (value: string) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{value?.slice(0, 12)}...</code>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value: any, row: Payment) => (
        <div className="flex gap-2">
          {row.status === "captured" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Refund
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Refund Payment</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will refund {formatINR(row.amount)} to the user. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRefund(row.id)}>Refund Payment</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ),
    },
  ]

  return (
    <div data-testid="admin-payments-table">
      <div className="flex gap-4 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Kinds</option>
          <option value="intro">Intro</option>
          <option value="invoice">Invoice</option>
          <option value="donation">Donation</option>
          <option value="draw">Draw</option>
        </select>
      </div>

      <DataTable columns={columns} data={payments} loading={loading} />
    </div>
  )
}
