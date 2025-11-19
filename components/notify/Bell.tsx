"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotifyRealtime } from "@/lib/notify-realtime"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Notification {
  id: string
  kind: string
  title: string
  body?: string
  href?: string
  read_at?: string
  created_at: string
}

interface BellProps {
  userId?: string
}

export function NotificationBell({ userId }: BellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch("/api/notify?limit=10")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.items || [])
        setUnreadCount(data.items?.filter((n: Notification) => !n.read_at).length || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleNewNotification = useCallback((newNotification: Notification) => {
    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])
    setUnreadCount((prev) => prev + 1)
  }, [])

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notify/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        setUnreadCount(0)
        setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  useNotifyRealtime(userId || null, handleNewNotification)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  if (!userId) return null

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          data-testid="notify-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass border-white/40">
        <div className="flex items-center justify-between p-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No notifications yet</div>
        ) : (
          <div className="max-h-96 overflow-y-auto" role="menu">
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild className="p-0">
                <Link
                  href={notification.href || "/notifications"}
                  className={`block p-3 hover:bg-white/20 transition-colors ${
                    !notification.read_at ? "bg-blue-50/50" : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-sm line-clamp-2">{notification.title}</div>
                    {notification.body && <div className="text-xs text-gray-600 line-clamp-2">{notification.body}</div>}
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="text-center text-sm">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
