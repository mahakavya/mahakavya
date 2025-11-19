"use client"

import { useState } from "react"
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface SessionHeaderProps {
  session: {
    id: string
    status: "requested" | "confirmed" | "completed" | "canceled"
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
  onStatusChange?: () => void
}

export function SessionHeader({ session, currentUserId, onStatusChange }: SessionHeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const isListener = session.listener.id === currentUserId
  const isSeeker = session.seeker.id === currentUserId
  const counterpart = isListener ? session.seeker : session.listener

  const startTime = new Date(session.slots.start_at)
  const endTime = new Date(session.slots.end_at)
  const now = new Date()

  const canConfirm = isListener && session.status === "requested"
  const canCancel = session.status !== "completed" && now < startTime
  const canComplete = (session.status === "confirmed" || session.status === "requested") && now >= endTime

  const updateSessionStatus = async (action: "confirm" | "complete" | "cancel") => {
    setIsUpdating(true)

    try {
      const response = await fetch("/api/sahaya/sessions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          action,
        }),
      })

      if (response.ok) {
        const actionMessages = {
          confirm: "Session confirmed",
          complete: "Session marked as completed",
          cancel: "Session canceled",
        }

        toast({
          title: actionMessages[action],
          description: "Status updated successfully",
        })
        onStatusChange?.()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to update session",
          description: error.error || "Please try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle, label: "Requested" },
      confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Confirmed" },
      completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Completed" },
      canceled: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Canceled" },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    const Icon = config.icon

    return (
      <Badge className={cn("flex items-center space-x-1", config.color)}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-6">
      <div className="flex flex-col space-y-4">
        {/* Participants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Listener */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-10 h-10 border-2 border-white/40">
                <AvatarImage src={session.listener.avatar_url || "/placeholder.svg"} alt={session.listener.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                  <User className="w-5 h-5 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{session.listener.name}</p>
                <p className="text-xs text-gray-500">Listener</p>
              </div>
            </div>

            <div className="text-gray-400">↔</div>

            {/* Seeker */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-10 h-10 border-2 border-white/40">
                <AvatarImage src={session.seeker.avatar_url || "/placeholder.svg"} alt={session.seeker.name} />
                <AvatarFallback className="bg-gradient-to-br from-green-100 to-blue-100">
                  <User className="w-5 h-5 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{session.seeker.name}</p>
                <p className="text-xs text-gray-500">Seeker</p>
              </div>
            </div>
          </div>

          {getStatusBadge(session.status)}
        </div>

        {/* Session Details */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{startTime.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>
              {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Actions */}
        {(canConfirm || canCancel || canComplete) && (
          <div className="flex space-x-2 pt-2 border-t border-white/20">
            {canConfirm && (
              <Button
                onClick={() => updateSessionStatus("confirm")}
                disabled={isUpdating}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {isUpdating ? "Confirming..." : "Confirm Session"}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={() => updateSessionStatus("complete")}
                disabled={isUpdating}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isUpdating ? "Completing..." : "Mark Complete"}
              </Button>
            )}

            {canCancel && (
              <Button
                onClick={() => updateSessionStatus("cancel")}
                disabled={isUpdating}
                size="sm"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                {isUpdating ? "Canceling..." : "Cancel Session"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
