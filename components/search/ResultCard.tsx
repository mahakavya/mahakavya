"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import type { SearchResult } from "@/lib/search-score"
import { formatINR } from "@/lib/money"

interface ResultCardProps {
  result: SearchResult
}

export function ResultCard({ result }: ResultCardProps) {
  const timeAgo = formatDistanceToNow(new Date(result.created_at), { addSuffix: true })

  return (
    <Link href={result.href} className="block">
      <Card className="glass hover:bg-white/80 transition-colors cursor-pointer" data-testid="search-result-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Thumbnail for reels */}
            {result.kind === "reel" && result.thumb_url && (
              <div className="flex-shrink-0">
                <img
                  src={result.thumb_url || "/placeholder.svg"}
                  alt="Reel thumbnail"
                  className="w-16 h-16 rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Cover for campaigns */}
            {result.kind === "campaign" && result.cover_url && (
              <div className="flex-shrink-0">
                <img
                  src={result.cover_url || "/placeholder.svg"}
                  alt="Campaign cover"
                  className="w-16 h-16 rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {result.kind}
                </Badge>
                <span className="text-sm text-gray-500">{timeAgo}</span>
              </div>

              {/* Content based on type */}
              {result.kind === "post" && (
                <>
                  <p className="text-sm text-gray-900 line-clamp-3 mb-2">{result.body}</p>
                  <p className="text-xs text-gray-500">by {result.author}</p>
                </>
              )}

              {result.kind === "reel" && (
                <>
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">{result.caption || "No caption"}</p>
                  <p className="text-xs text-gray-500">by {result.author}</p>
                </>
              )}

              {result.kind === "campaign" && (
                <>
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{result.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>by {result.creator}</span>
                    <span>
                      {formatINR(result.raised_amount)} of {formatINR(result.goal_amount)}
                    </span>
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (result.raised_amount / result.goal_amount) * 100)}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
