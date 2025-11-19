"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  placeholder?: string
  className?: string
}

export function SearchInput({ placeholder = "Search posts, reels, campaigns…", className = "" }: SearchInputProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}&type=all`)
      }
    },
    [query, router],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("")
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 glass border-white/40"
          aria-label="Search"
          data-testid="search-input"
          role="searchbox"
        />
      </div>
    </form>
  )
}
