"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatINR } from "@/lib/money"
import { formatDistanceToNow } from "date-fns"
import { Heart, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Donation {
  id: string
  amount: number
  created_at: string
  status: string
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  meta?: {
    receipt_url?: string
    [key: string]: any
  }
}

interface DonationListProps {
  campaignId: string
  className?: string
  showReceipts?: boolean
  currentUserId?: string
}

export function DonationList({ campaignId, className = "", showReceipts = false, currentUserId }: DonationListProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/donations`)
        if (response.ok) {
          const data = await response.json()
          setDonations(data.items || [])
        }
      } catch (error) {
        console.error("Failed to fetch donations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDonations()
  }, [campaignId])

  const handleDownloadReceipt = async (donationId: string) => {
    if (downloadingIds.has(donationId)) return

    setDownloadingIds((prev) => new Set(prev).add(donationId))
    try {
      const response = await fetch("/api/donations/receipt/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate receipt")
      }

      const { url } = await response.json()
      window.open(url, "_blank")

      toast({
        title: "Receipt downloaded",
        description: "Your donation receipt PDF has been generated successfully.",
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "Download failed",
        description: "Unable to generate receipt PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev)
        next.delete(donationId)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <Card className={`bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Recent Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (donations.length === 0) {
    return (
      <Card className={`bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Recent Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No donations yet</p>
            <p className="text-xs">Be the first to support this campaign!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Recent Donations ({donations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {donations.map((donation) => (
            <div key={donation.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={donation.user.avatar_url || "/placeholder.svg"} alt={donation.user.name} />
                <AvatarFallback className="text-xs">{donation.user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{donation.user.name}</div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(donation.created_at), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-green-600">{formatINR(donation.amount)}</div>
                {showReceipts && currentUserId === donation.user.id && donation.status === "captured" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(donation.id)}
                    disabled={downloadingIds.has(donation.id)}
                    data-testid="download-receipt"
                    aria-label="Download donation receipt PDF"
                  >
                    <Download className="h-3 w-3" />
                    {downloadingIds.has(donation.id) ? "..." : "Receipt"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
