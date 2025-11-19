"use client"

import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface EntriesCountProps {
  count: number
  className?: string
}

export function EntriesCount({ count, className = "" }: EntriesCountProps) {
  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <Users className="h-3 w-3" />
      <span>
        {count} {count === 1 ? "entry" : "entries"}
      </span>
    </Badge>
  )
}
