"use client"

import { useState, useEffect } from "react"
import { Calendar, Video, Phone, MessageSquare, User, Star, Brain, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface Listener {
  id: string
  name: string
  avatar_url?: string
  bio: string
  specializations: string[]
  languages: string[]
  rating: number
  total_sessions: number
  ai_enhanced: boolean
  blockchain_verified: boolean
  premium_tier: string
  available_slots: {
    id: string
    start_at: string
    end_at: string
  }[]
}

interface SessionSchedulerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionScheduled: () => void
}

export function SessionScheduler({ open, onOpenChange, onSessionScheduled }: SessionSchedulerProps) {
  const [step, setStep] = useState(1)
  const [listeners, setListeners] = useState<Listener[]>([])
  const [selectedListener, setSelectedListener] = useState<Listener | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [sessionType, setSessionType] = useState<"video" | "audio" | "chat">("video")
  const [duration, setDuration] = useState<30 | 60 | 90>(60)
  const [topic, setTopic] = useState("")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium")
  const [aiEnhanced, setAiEnhanced] = useState(true)
  const [blockchainVerified, setBlockchainVerified] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchAvailableListeners()
    }
  }, [open])

  const fetchAvailableListeners = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sahaya/listeners/available")
      if (response.ok) {
        const data = await response.json()
        setListeners(data.listeners || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load available listeners",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching listeners:", error)
      toast({
        title: "Error",
        description: "Network error while loading listeners",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleListenerSelect = (listener: Listener) => {
    setSelectedListener(listener)
    setStep(2)
  }

  const handleScheduleSession = async () => {
    if (!selectedListener || !selectedSlot) {
      toast({
        title: "Error",
        description: "Please select a listener and time slot",
        variant: "destructive",
      })
      return
    }

    try {
      setIsScheduling(true)

      const response = await fetch("/api/sahaya/sessions/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listener_id: selectedListener.id,
          slot_id: selectedSlot,
          session_type: sessionType,
          duration,
          topic,
          urgency,
          ai_enhanced: aiEnhanced,
          blockchain_verified: blockchainVerified,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Log blockchain transaction
        await fetch("/api/sahaya/blockchain-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: result.sessionId,
            transaction_type: "session_scheduled",
            listener_id: selectedListener.id,
          }),
        })

        // Create RPA optimization job
        await fetch("/api/sahaya/rpa-optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: result.sessionId,
            optimization_type: "session_preparation",
          }),
        })

        toast({
          title: "Session Scheduled",
          description: `Your session with ${selectedListener.name} has been scheduled successfully`,
        })

        onSessionScheduled()
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Scheduling Failed",
          description: error.message || "Failed to schedule session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error scheduling session:", error)
      toast({
        title: "Error",
        description: "Network error occurred while scheduling",
        variant: "destructive",
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedListener(null)
    setSelectedSlot("")
    setSessionType("video")
    setDuration(60)
    setTopic("")
    setUrgency("medium")
    setAiEnhanced(true)
    setBlockchainVerified(true)
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-md border-white/40">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule Session</span>
            <Badge variant="outline">Step {step} of 2</Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose a Listener</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {listeners.map((listener) => (
                    <Card
                      key={listener.id}
                      className="cursor-pointer hover:shadow-md transition-shadow bg-white/60 backdrop-blur-md border-white/40"
                      onClick={() => handleListenerSelect(listener)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Avatar className="w-16 h-16 border-2 border-white/40">
                            <AvatarImage src={listener.avatar_url || "/placeholder.svg"} alt={listener.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                              <User className="w-8 h-8 text-gray-600" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-lg">{listener.name}</h4>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{listener.rating}</span>
                              </div>
                              {listener.ai_enhanced && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI Enhanced
                                </Badge>
                              )}
                              {listener.blockchain_verified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              {listener.premium_tier === "premium" && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Zap className="w-3 h-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listener.bio}</p>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {listener.specializations.slice(0, 3).map((spec) => (
                                <Badge key={spec} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {listener.specializations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{listener.specializations.length - 3} more
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{listener.total_sessions} sessions completed</span>
                              <span>{listener.available_slots.length} slots available</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedListener && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedListener.avatar_url || "/placeholder.svg"} alt={selectedListener.name} />
                <AvatarFallback>
                  <User className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{selectedListener.name}</h4>
                <p className="text-sm text-gray-600">Selected Listener</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Change
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Available Time Slots</label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedListener.available_slots.map((slot) => {
                        const { date, time } = formatDateTime(slot.start_at)
                        const endTime = formatDateTime(slot.end_at).time
                        return (
                          <SelectItem key={slot.id} value={slot.id}>
                            {date} • {time} - {endTime}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Session Type</label>
                  <Select
                    value={sessionType}
                    onValueChange={(value: "video" | "audio" | "chat") => setSessionType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center space-x-2">
                          <Video className="w-4 h-4" />
                          <span>Video Call</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Audio Call</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="chat">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat Session</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration</label>
                  <Select
                    value={duration.toString()}
                    onValueChange={(value) => setDuration(Number.parseInt(value) as 30 | 60 | 90)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Urgency Level</label>
                  <Select value={urgency} onValueChange={(value: "low" | "medium" | "high") => setUrgency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic (Optional)</label>
                  <Textarea
                    placeholder="Briefly describe what you'd like to discuss..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Premium Features</h4>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">AI Enhancement</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Blockchain Verification</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">RPA Optimization</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800">Enabled</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleScheduleSession}
                disabled={!selectedSlot || isScheduling}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isScheduling ? "Scheduling..." : "Schedule Session"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
