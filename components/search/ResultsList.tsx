"use client"

import { useState, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import { ResultCard } from "./ResultCard"
import { EmptyState } from "@/components/empty-state"
import type { SearchResult } from "@/lib/search-score"
import { Loader2 } from "lucide-react"

interface ResultsListProps {
  q: string
  type: "all" | "post" | "reel" | "campaign"
}

export function ResultsList({ q, type }: ResultsListProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  })

  const fetchResults = useCallback(
    async (cursor?: string, reset = false) => {
      if (loading) return

      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q,
          type,
          limit: "20",
        })

        if (cursor) {
          params.set("cursor", cursor)
        }

        const response = await fetch(`/api/search?${params}`)
        if (!response.ok) {
          throw new Error("Search failed")
        }

        const data = await response.json()

        if (reset) {
          setResults(data.items)
        } else {
          setResults((prev) => [...prev, ...data.items])
        }

        setNextCursor(data.nextCursor)
        setHasMore(!!data.nextCursor)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed")
      } finally {
        setLoading(false)
      }
    },
    [q, type, loading],
  )

  // Initial fetch and reset on query/type change
  useEffect(() => {
    setResults([])
    setNextCursor(null)
    setHasMore(true)
    fetchResults(undefined, true)
  }, [q, type])

  // Load more when in view
  useEffect(() => {
    if (inView && hasMore && !loading && nextCursor) {
      fetchResults(nextCursor)
    }
  }, [inView, hasMore, loading, nextCursor, fetchResults])

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => fetchResults(undefined, true)} className="text-blue-600 hover:underline">
          Try again
        </button>
      </div>
    )
  }

  if (!loading && results.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description={`No ${type === "all" ? "content" : type + "s"} found for "${q}"`}
      />
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <ResultCard key={`${result.kind}-${result.id}-${index}`} result={result} />
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && !loading && <div ref={ref} className="h-4" />}

      {/* End message */}
      {!hasMore && results.length > 0 && <p className="text-center text-gray-500 py-4">No more results</p>}
    </div>
  )
}
