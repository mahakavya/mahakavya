"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"

interface Notification {
  id: string
  kind: string
  title: string
  body?: string
  href?: string
  read_at?: string
  created_at: string
}

const kindLabels: Record<string, string> = {
  message: "Message",
  donation: "Donation",
  draw: "Lucky Draw",
  session: "Support Session",
  system: "System",
}

const kindColors: Record<string, string> = {
  message: "bg-blue-100 text-blue-800",
  donation: "bg-green-100 text-green-800",
  draw: "bg-purple-100 text-purple-800",
  session: "bg-orange-100 text-orange-800",
  system: "bg-gray-100 text-gray-800",
}

export function NotificationInbox() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = useCallback(
    async (reset = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          limit: "20",
          ...(filter === "unread" && { unread_only: "1" }),
          ...(cursor && !reset && { cursor }),
        })

        const response = await fetch(`/api/notify?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (reset) {
            setNotifications(data.items || [])
          } else {
            setNotifications((prev) => [...prev, ...(data.items || [])])
          }
          setCursor(data.nextCursor)
          setHasMore(!!data.nextCursor)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setLoading(false)
      }
    },
    [cursor, filter],
  )

  const markSelectedAsRead = async () => {
    if (selectedIds.size === 0) return

    try {
      const response = await fetch("/api/notify/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (selectedIds.has(n.id) ? { ...n, read_at: new Date().toISOString() } : n)),
        )
        setSelectedIds(new Set())
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error)
    }
  }

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)))
    }
  }

  useEffect(() => {
    setCursor(null)
    setHasMore(true)
    fetchNotifications(true)
  }, [filter])

  const unreadNotifications = notifications.filter((n) => !n.read_at)
  const unreadCount = unreadNotifications.length

  return (
    <div className="space-y-6" data-testid="notify-inbox">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "unread")}>
        <div className="flex items-center justify-between">
          <TabsList className="glass border-white/40">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
              <Button size="sm" onClick={markSelectedAsRead} className="flex items-center gap-2">
                <CheckCheck className="h-4 w-4" />
                Mark as read
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="all" className="space-y-4">
          {notifications.length === 0 && !loading ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="You're all caught up! New notifications will appear here."
            />
          ) : (
            <Card className="glass border-white/40">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">All Notifications</CardTitle>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.size === notifications.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all notifications"
                      />
                      <span className="text-sm text-gray-600">Select all</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      !notification.read_at ? "bg-blue-50/50 border-blue-200/50" : "bg-white/20 border-white/40"
                    } hover:bg-white/30`}
                  >
                    <Checkbox
                      checked={selectedIds.has(notification.id)}
                      onCheckedChange={() => toggleSelection(notification.id)}
                      aria-label={`Select notification: ${notification.title}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${kindColors[notification.kind] || kindColors.system}`}
                            >
                              {kindLabels[notification.kind] || notification.kind}
                            </Badge>
                            {!notification.read_at && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" aria-label="Unread" />
                            )}
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{notification.title}</h3>
                          {notification.body && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{notification.body}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {notification.href && (
                          <Button asChild variant="ghost" size="sm" className="shrink-0">
                            <Link href={notification.href}>
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open notification</span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchNotifications()}
                      disabled={loading}
                      className="glass border-white/40"
                    >
                      {loading ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length === 0 ? (
            <EmptyState icon={CheckCheck} title="All caught up!" description="You have no unread notifications." />
          ) : (
            <Card className="glass border-white/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Unread Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-200/50 hover:bg-blue-100/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.has(notification.id)}
                      onCheckedChange={() => toggleSelection(notification.id)}
                      aria-label={`Select notification: ${notification.title}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${kindColors[notification.kind] || kindColors.system}`}
                            >
                              {kindLabels[notification.kind] || notification.kind}
                            </Badge>
                            <div className="w-2 h-2 bg-blue-500 rounded-full" aria-label="Unread" />
                          </div>
                          <h3 className="font-medium text-sm mb-1 line-clamp-2">{notification.title}</h3>
                          {notification.body && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-3">{notification.body}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {notification.href && (
                          <Button asChild variant="ghost" size="sm" className="shrink-0">
                            <Link href={notification.href}>
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Open notification</span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
