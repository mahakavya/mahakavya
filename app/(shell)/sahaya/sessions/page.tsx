"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Video, Search, Plus, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SessionCard } from "@/components/sahaya/SessionCard"
import { SessionScheduler } from "@/components/sahaya/SessionScheduler"
import { SessionAnalytics } from "@/components/sahaya/SessionAnalytics"
import { AISessionInsights } from "@/components/sahaya/AISessionInsights"
import { BlockchainSessionStatus } from "@/components/sahaya/BlockchainSessionStatus"
import { RPASessionStatus } from "@/components/sahaya/RPASessionStatus"
import { AccessGate } from "@/components/access-gate"
import { useToast } from "@/hooks/use-toast"
import { useSahayaRealtime } from "@/lib/sahaya-realtime"

interface Session {
  id: string
  status: "scheduled" | "active" | "completed" | "cancelled"
  scheduled_at: string
  duration: number
  listener: {
    id: string
    name: string
    avatar_url?: string
    specializations: string[]
    rating: number
  }
  seeker: {
    id: string
    name: string
    avatar_url?: string
  }
  session_type: "video" | "audio" | "chat"
  ai_enhanced: boolean
  blockchain_verified: boolean
  created_at: string
}

export default function SahayaSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showScheduler, setShowScheduler] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    averageRating: 0,
    totalHours: 0,
  })
  const { toast } = useToast()

  // Real-time updates for sessions
  useSahayaRealtime({
    onSession: (session) => {
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === session.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = session
          return updated
        }
        return [session, ...prev]
      })
    },
  })

  useEffect(() => {
    fetchSessions()
    fetchSessionStats()
    getCurrentUser()
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchQuery, statusFilter, typeFilter])

  const getCurrentUser = async () => {
    try {
      const response = await fetch("/api/me")
      if (response.ok) {
        const user = await response.json()
        setCurrentUserId(user.id)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/sahaya/sessions/list")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load sessions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        title: "Error",
        description: "Network error while loading sessions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSessionStats = async () => {
    try {
      const response = await fetch("/api/sahaya/sessions/stats")
      if (response.ok) {
        const stats = await response.json()
        setSessionStats(stats)
      }
    } catch (error) {
      console.error("Error fetching session stats:", error)
    }
  }

  const filterSessions = () => {
    let filtered = sessions

    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.listener.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.listener.specializations.some((spec) => spec.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((session) => session.session_type === typeFilter)
    }

    setFilteredSessions(filtered)
  }

  const handleSessionAction = async (sessionId: string, action: string) => {
    try {
      const response = await fetch("/api/sahaya/sessions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Session ${action} successfully`,
        })
        fetchSessions()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.message || `Failed to ${action} session`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      })
    }
  }

  const handleScheduleSession = () => {
    setShowScheduler(true)
  }

  const handleSessionScheduled = () => {
    setShowScheduler(false)
    fetchSessions()
    fetchSessionStats()
    toast({
      title: "Success",
      description: "Session scheduled successfully",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AccessGate
      feature="can_emotional"
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
              <p className="text-gray-600 mb-4">
                Sahaya Sessions require premium access to schedule 1-on-1 calls with listeners.
              </p>
              <Button className="w-full">Upgrade to Premium</Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sahaya Sessions</h1>
              <p className="text-gray-600">Schedule and manage your 1-on-1 calls with listeners</p>
            </div>
            <Button onClick={handleScheduleSession} className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{sessionStats.total}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-green-600">{sessionStats.scheduled}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{sessionStats.completed}</p>
                  </div>
                  <Video className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-purple-600">{sessionStats.totalHours}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI, Blockchain, RPA Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <AISessionInsights userId={currentUserId} />
            <BlockchainSessionStatus userId={currentUserId} />
            <RPASessionStatus userId={currentUserId} />
          </div>

          {/* Filters and Search */}
          <Card className="bg-white/60 backdrop-blur-md border-white/40 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search listeners or specializations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="audio">Audio Call</SelectItem>
                    <SelectItem value="chat">Chat Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Sessions Tabs */}
          <Tabs defaultValue="sessions" className="space-y-6">
            <TabsList className="bg-white/60 backdrop-blur-md border-white/40">
              <TabsTrigger value="sessions">My Sessions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="space-y-4">
              {filteredSessions.length === 0 ? (
                <Card className="bg-white/60 backdrop-blur-md border-white/40">
                  <CardContent className="p-8 text-center">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                        ? "Try adjusting your filters to see more sessions."
                        : "Schedule your first session with a listener to get started."}
                    </p>
                    <Button onClick={handleScheduleSession}>
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={currentUserId}
                      onAction={handleSessionAction}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <SessionAnalytics userId={currentUserId} />
            </TabsContent>
          </Tabs>

          {/* Session Scheduler Modal */}
          {showScheduler && (
            <SessionScheduler
              open={showScheduler}
              onOpenChange={setShowScheduler}
              onSessionScheduled={handleSessionScheduled}
            />
          )}
        </div>
      </div>
    </AccessGate>
  )
}
