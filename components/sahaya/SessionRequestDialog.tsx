"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { SessionRequestSchema, type SessionRequestInput } from "@/lib/validators"
import { useRouter } from "next/navigation"

interface SessionRequestDialogProps {
  slotId: string
  slotTime: {
    start: string
    end: string
  }
  listenerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionRequestDialog({
  slotId,
  slotTime,
  listenerName,
  open,
  onOpenChange,
}: SessionRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<SessionRequestInput>({
    resolver: zodResolver(SessionRequestSchema),
    defaultValues: {
      slotId,
      note: "",
    },
  })

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const startTime = formatDateTime(slotTime.start)
  const endTime = formatDateTime(slotTime.end)

  const onSubmit = async (data: SessionRequestInput) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/sahaya/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Session requested",
          description: `Your session with ${listenerName} has been requested. You'll be notified when they confirm.`,
        })
        onOpenChange(false)
        router.push(`/sahaya/session/${result.sessionId}`)
      } else {
        const error = await response.json()
        toast({
          title: "Failed to request session",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/90 backdrop-blur-md border-white/40 rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Request Session</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Details */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-blue-800">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Session Details</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>
                <strong>Listener:</strong> {listenerName}
              </p>
              <p>
                <strong>Date:</strong> {startTime.date}
              </p>
              <p>
                <strong>Time:</strong> {startTime.time} - {endTime.time}
              </p>
            </div>
          </div>

          {/* Request Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share anything you'd like the listener to know beforehand..."
                        className="bg-white/60 backdrop-blur-md border-white/40"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? "Requesting..." : "Request Session"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Info */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p>
              <strong>Note:</strong> The listener will be notified of your request and can confirm or decline. You'll
              receive a notification once they respond.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
