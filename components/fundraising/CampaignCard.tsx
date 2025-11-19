"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatINR } from "@/lib/money"
import { formatDistanceToNow } from "date-fns"

interface CampaignCardProps {
  id: string
  title: string
  cover_url?: string
  goal_amount: number
  raised_amount: number
  owner: {
    name: string
    avatar_url?: string
  }
  created_at: string
  status?: string
}

export function CampaignCard({
  id,
  title,
  cover_url,
  goal_amount,
  raised_amount,
  owner,
  created_at,
  status,
}: CampaignCardProps) {
  const progress = Math.min((raised_amount / goal_amount) * 100, 100)

  return (
    <Card
      className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      data-testid="campaign-card"
    >
      <div className="aspect-video relative overflow-hidden">
        {cover_url ? (
          <Image src={cover_url || "/placeholder.svg"} alt={title} fill className="object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <div className="text-orange-400 text-4xl">📢</div>
          </div>
        )}
        {status && status !== "live" && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm">
            {status}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight">{title}</h3>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={owner.avatar_url || "/placeholder.svg"} alt={owner.name} />
              <AvatarFallback className="text-xs">{owner.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{owner.name}</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-900">{formatINR(raised_amount)} raised</span>
            <span className="text-gray-600">of {formatINR(goal_amount)}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-gray-500">{progress.toFixed(1)}% funded</div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/nivedana/${id}`}>View Campaign</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
