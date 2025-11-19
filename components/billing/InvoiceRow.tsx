"use client"

import { useState } from "react"
import { ExternalLink, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/money"
import { formatIST } from "@/lib/dates"
import { useToast } from "@/hooks/use-toast"

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  meta: {
    invoice_url?: string
    [key: string]: any
  }
}

interface InvoiceRowProps {
  invoice: Invoice
}

export function InvoiceRow({ invoice }: InvoiceRowProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "captured":
        return <Badge className="bg-green-600">Paid</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDownloadInvoice = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch("/api/billing/invoice/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: invoice.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate invoice")
      }

      const { url } = await response.json()
      window.open(url, "_blank")

      toast({
        title: "Invoice downloaded",
        description: "Your invoice PDF has been generated successfully.",
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "Download failed",
        description: "Unable to generate invoice PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 last:border-b-0"
      data-testid="invoice-row"
    >
      <div className="flex-1 space-y-1 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm text-gray-600">{formatIST(invoice.created_at)}</span>
          <span className="font-medium">{formatINR(invoice.amount)}</span>
          {getStatusBadge(invoice.status)}
        </div>
      </div>

      <div className="mt-2 sm:mt-0 flex gap-2">
        {invoice.status === "captured" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            data-testid="download-invoice"
            aria-label="Download invoice PDF"
          >
            <Download className="h-3 w-3 mr-1" />
            {isDownloading ? "Generating..." : "Download"}
          </Button>
        )}

        {invoice.meta?.invoice_url && (
          <Button variant="outline" size="sm" asChild>
            <a
              href={invoice.meta.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              View
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
