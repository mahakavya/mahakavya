"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatINR } from "@/lib/money"
import { TrendingUp, Users } from "lucide-react"

interface TrendingCampaign {
  id: string
  title: string
  amount_24h: number
  donors_24h: number
}

export function TrendingCampaigns() {
  const [campaigns, setCampaigns] = useState<TrendingCampaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch("/api/trending")
        if (response.ok) {
          const data = await response.json()
          setCampaigns(data.campaigns || [])
        }
      } catch (error) {
        console.error("Failed to fetch trending campaigns:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [])

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Trending Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (campaigns.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Trending Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No trending campaigns yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass" data-testid="trending-campaigns">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Trending Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {campaigns.slice(0, 6).map((campaign) => (
            <Link
              key={campaign.id}
              href={`/nivedana/${campaign.id}`}
              className="block hover:bg-white/50 rounded-lg p-2 -m-2 transition-colors"
            >
              <h4 className="font-medium text-sm line-clamp-2 mb-1">{campaign.title}</h4>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="font-medium text-green-600">{formatINR(campaign.amount_24h)}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {campaign.donors_24h} donors
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
