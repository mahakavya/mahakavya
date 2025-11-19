"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toTagHref } from "@/lib/hashtags"
import { TrendingUp } from "lucide-react"

interface TrendingTag {
  tag: string
  count: number
}

export function TrendingTags() {
  const [tags, setTags] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch("/api/trending")
        if (response.ok) {
          const data = await response.json()
          setTags(data.tags || [])
        }
      } catch (error) {
        console.error("Failed to fetch trending tags:", error)
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
            Trending Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tags.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Trending Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No trending tags yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass" data-testid="trending-tags">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Trending Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 15).map((tag) => (
            <Link key={tag.tag} href={toTagHref(tag.tag)}>
              <Badge variant="secondary" className="hover:bg-blue-100 transition-colors cursor-pointer">
                #{tag.tag} ({tag.count})
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
