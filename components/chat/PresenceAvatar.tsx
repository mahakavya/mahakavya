"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface PresenceAvatarProps {
  user: {
    id: string
    name: string
    avatar_url: string | null
  }
  lastSeen?: string
  className?: string
}

export function PresenceAvatar({ user, lastSeen, className }: PresenceAvatarProps) {
  const isOnline = lastSeen
    ? new Date().getTime() - new Date(lastSeen).getTime() < 120000
    : // 2 minutes
      false

  const getStatusText = () => {
    if (!lastSeen) return "Unknown"
    if (isOnline) return "Online"
    return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
  }

  return (
    <div className={cn("relative", className)} title={getStatusText()}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
          {user.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Status Dot */}
      <div
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
          isOnline ? "bg-green-500" : "bg-gray-400",
        )}
      />
    </div>
  )
}
