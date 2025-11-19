"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CaptionProps {
  text?: string
  className?: string
}

export function Caption({ text, className = "" }: CaptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text) return null

  const shouldTruncate = text.length > 100
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, 100)}...` : text

  // Parse hashtags and mentions
  const parseText = (text: string) => {
    const parts = text.split(/(\s+)/)

    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="text-blue-400 font-medium cursor-pointer hover:underline">
            {part}
          </span>
        )
      } else if (part.startsWith("@")) {
        return (
          <span key={index} className="text-purple-400 font-medium cursor-pointer hover:underline">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className={`text-white ${className}`}>
      <p className="text-sm leading-relaxed">{parseText(displayText)}</p>

      {shouldTruncate && (
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="text-gray-300 hover:text-white p-0 h-auto text-sm mt-1"
        >
          {isExpanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}
