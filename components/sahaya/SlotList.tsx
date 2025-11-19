"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSahayaRealtime } from "@/lib/sahaya-realtime"
import { cn } from "@/lib/utils"

interface Slot {
  id: string
  start_at: string
  end_at: string
  is_booked: boolean
}

interface SlotListProps {
  listenerId: string
  onSlotSelect?: (slotId: string) => void
}

export function SlotList({ listenerId, onSlotSelect }: SlotListProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available slots
  const fetchSlots = async () => {
    try {
      const from = new Date().toISOString()
      const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // Next 2 weeks

      const response = await fetch(`/api/sahaya/slots?listenerId=${listenerId}&from=${from}&to=${to}`)
      if (response.ok) {
        const data = await response.json()
        // Only show available slots that are in the future
        const availableSlots = data.slots.filter(
          (slot: Slot) => !slot.is_booked && new Date(slot.start_at) > new Date(),
        )
        setSlots(availableSlots)
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [listenerId])

  // Real-time updates
  useSahayaRealtime({
    listenerId,
    onSlot: (slot) => {
      setSlots((prev) => {
        if (slot.is_booked || new Date(slot.start_at) <= new Date()) {
          // Remove booked or past slots
          return prev.filter((s) => s.id !== slot.id)
        } else {
          // Add or update available slots
          const existing = prev.find((s) => s.id === slot.id)
          if (existing) {
            return prev.map((s) => (s.id === slot.id ? slot : s))
          } else {
            return [...prev, slot].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
          }
        }
      })
    },
  })

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()

    let dateLabel = date.toLocaleDateString()
    if (isToday) dateLabel = "Today"
    else if (isTomorrow) dateLabel = "Tomorrow"

    return {
      date: dateLabel,
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      full: date.toLocaleString(),
    }
  }

  const groupSlotsByDate = (slots: Slot[]) => {
    const groups: { [key: string]: Slot[] } = {}
    slots.forEach((slot) => {
      const date = new Date(slot.start_at).toDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(slot)
    })
    return groups
  }

  const slotGroups = groupSlotsByDate(slots)

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (slots.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Available Times</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No available slots</p>
            <p className="text-sm">This listener hasn't added any availability yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Available Times</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(slotGroups).map(([dateString, dateSlots]) => {
            const firstSlot = dateSlots[0]
            const dateInfo = formatDateTime(firstSlot.start_at)

            return (
              <div key={dateString} className="space-y-2">
                <h4 className="font-medium text-gray-900 text-sm">{dateInfo.date}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {dateSlots.map((slot) => {
                    const slotTime = formatDateTime(slot.start_at)
                    const endTime = formatDateTime(slot.end_at)

                    return (
                      <Button
                        key={slot.id}
                        onClick={() => onSlotSelect?.(slot.id)}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "justify-start bg-white/60 backdrop-blur-md border-white/40 hover:bg-blue-50 hover:border-blue-200",
                          "transition-all duration-200",
                        )}
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm">
                            {slotTime.time} - {endTime.time}
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
