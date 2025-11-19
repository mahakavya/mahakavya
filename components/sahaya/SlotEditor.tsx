"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Clock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { SlotCreateSchema, type SlotCreateInput } from "@/lib/validators"
import { useSahayaRealtime } from "@/lib/sahaya-realtime"
import { cn } from "@/lib/utils"

interface Slot {
  id: string
  start_at: string
  end_at: string
  is_booked: boolean
}

interface SlotEditorProps {
  listenerId: string
}

export function SlotEditor({ listenerId }: SlotEditorProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<SlotCreateInput>({
    resolver: zodResolver(SlotCreateSchema),
    defaultValues: {
      startAt: "",
      endAt: "",
    },
  })

  // Fetch slots
  const fetchSlots = async () => {
    try {
      const from = new Date().toISOString()
      const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // Next 2 weeks

      const response = await fetch(`/api/sahaya/slots?listenerId=${listenerId}&from=${from}&to=${to}`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data.slots)
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
        const existing = prev.find((s) => s.id === slot.id)
        if (existing) {
          return prev.map((s) => (s.id === slot.id ? slot : s))
        } else {
          return [...prev, slot].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
        }
      })
    },
  })

  const onSubmit = async (data: SlotCreateInput) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sahaya/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Slot added",
          description: "Your availability slot has been created",
        })
        form.reset()
        fetchSlots() // Refresh slots
      } else {
        const error = await response.json()
        toast({
          title: "Failed to add slot",
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
      setIsSubmitting(false)
    }
  }

  const deleteSlot = async (slotId: string) => {
    try {
      const response = await fetch(`/api/sahaya/slots/${slotId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSlots((prev) => prev.filter((s) => s.id !== slotId))
        toast({
          title: "Slot deleted",
          description: "Availability slot has been removed",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to delete slot",
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
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <div className="space-y-6" data-testid="slot-editor">
      {/* Add Slot Form */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Availability Slot</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="bg-white/60 backdrop-blur-md border-white/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="bg-white/60 backdrop-blur-md border-white/40"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                {isSubmitting ? "Adding..." : "Add Slot"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Existing Slots */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Your Availability</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No availability slots yet</p>
              <p className="text-sm">Add your first slot above to start accepting sessions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const start = formatDateTime(slot.start_at)
                const end = formatDateTime(slot.end_at)

                return (
                  <div
                    key={slot.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      slot.is_booked ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200",
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">{start.date}</p>
                          <p className="text-sm text-gray-600">
                            {start.time} - {end.time}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            slot.is_booked ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800",
                          )}
                        >
                          {slot.is_booked ? "Booked" : "Available"}
                        </div>
                      </div>
                    </div>

                    {!slot.is_booked && (
                      <Button
                        onClick={() => deleteSlot(slot.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
