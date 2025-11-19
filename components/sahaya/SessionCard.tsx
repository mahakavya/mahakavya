"use client"

import { Calendar, Clock, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SessionCardProps {
  session: {
    id: string
    status: "requested" | "confirmed" | "completed" | "canceled"
    created_at: string
    listener: {
      id: string
      name: string
      avatar_url?: string
    }
    seeker: {
      id: string
      name: string
      avatar_url?: string
    }
    slots: {
      start_at: string
      end_at: string
    }
  }
  currentUserId: string
  onOpen?: (sessionId: string) => void
}

export function SessionCard({ session, currentUserId, onOpen }: SessionCardProps) {
  const isListener = session.listener.id === currentUserId
  const counterpart = isListener ? session.seeker : session.listener
  const role = isListener ? "Listener" : "Seeker"

  const startTime = new Date(session.slots.start_at)
  const endTime = new Date(session.slots.end_at)
  const now = new Date()

  const isUpcoming = startTime > now
  const isActive = now >= startTime && now <= endTime
  const isPast = endTime < now

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTimeLabel = () => {
    if (isActive) return "Active Now"
    if (isUpcoming) return "Upcoming"
    if (isPast) return "Past"
    return ""
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Counterpart info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12 border-2 border-white/40">
              <AvatarImage src={counterpart.avatar_url || "/placeholder.svg"} alt={counterpart.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                <User className="w-6 h-6 text-gray-600" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-gray-900 truncate">{counterpart.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {role}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{startTime.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Status and action */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <Badge className={cn("mb-1", getStatusColor(session.status))}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </Badge>
              {getTimeLabel() && <p className="text-xs text-gray-500">{getTimeLabel()}</p>}
            </div>

            <Button
              onClick={() => onOpen?.(session.id)}
              size="sm"
              className={cn("bg-blue-500 hover:bg-blue-600 text-white", isActive && "bg-green-500 hover:bg-green-600")}
            >
              {isActive ? "Join" : "Open"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
