"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { AccessGate } from "@/components/access-gate"
import { ListenerCard } from "@/components/sahaya/ListenerCard"
import { SessionCard } from "@/components/sahaya/SessionCard"
import { SessionRequestDialog } from "@/components/sahaya/SessionRequestDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/hooks/use-toast"
import { useAI } from "@/hooks/useAI"
import { useBlockchainVerification } from "@/hooks/useBlockchainVerification"
import { useRPA } from "@/hooks/useRPA"
import { AIInsightsPanel } from "@/components/sahaya/AIInsightsPanel"
import { BlockchainStatusPanel } from "@/components/sahaya/BlockchainStatusPanel"
import { RPAStatusPanel } from "@/components/sahaya/RPAStatusPanel"
import { AnonymousSupportPanel } from "@/components/sahaya/AnonymousSupportPanel"
import { Search, UserPlus } from "lucide-react"

interface Listener {
  id: string
  name: string
  bio: string
  avatar_url?: string
  specialties: string[]
  availability: string
  rating: number
  is_online: boolean
}

interface Session {
  id: string
  listener_id: string
  user_id: string
  start_time: string
  end_time: string
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
}

export default function SahayaPage() {
  const [listeners, setListeners] = useState<Listener[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedListener, setSelectedListener] = useState<Listener | null>(null)
  const { toast } = useToast()
  const { generateSessionSummary } = useAI()
  const { verifySessionData } = useBlockchainVerification()
  const { automateSessionTasks } = useRPA()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Simulate fetching listeners and sessions
        const [listenersData, sessionsData] = await Promise.all([
          fetch("/api/sahaya/listeners").then((res) => res.json()),
          fetch("/api/sahaya/sessions").then((res) => res.json()),
        ])

        setListeners(listenersData.items || [])
        setSessions(sessionsData.items || [])
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Error",
          description: "Failed to load Sahaya data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleRequestSession = (listener: Listener) => {
    setSelectedListener(listener)
    setShowRequestDialog(true)
  }

  const handleSessionCreate = async (data: any) => {
    // Simulate session creation
    try {
      // Generate session summary using AI
      const summary = await generateSessionSummary(data.topic)

      // Verify session data using blockchain
      const isVerified = await verifySessionData(data)

      // Automate session tasks using RPA
      await automateSessionTasks(data)

      toast({
        title: "Success!",
        description: "Session requested successfully",
      })
      setShowRequestDialog(false)
    } catch (error) {
      console.error("Session creation error:", error)
      toast({
        title: "Error",
        description: "Failed to request session",
        variant: "destructive",
      })
    }
  }

  const filteredListeners = listeners.filter((listener) =>
    listener.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AccessGate feature="premium">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <PageHeader
          title="Sahaya — Emotional Support"
          subtitle="Connect with trained listeners for mental health and emotional wellbeing"
        />

        {/* AI Insights, Blockchain Status, and RPA Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <AIInsightsPanel />
          <BlockchainStatusPanel />
          <RPAStatusPanel />
        </div>

        {/* Anonymous Support Panel */}
        <AnonymousSupportPanel />

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-start sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search listeners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Become a Listener
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listeners" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="listeners">Listeners ({filteredListeners.length})</TabsTrigger>
            <TabsTrigger value="sessions">My Sessions ({sessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listeners" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredListeners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListeners.map((listener) => (
                  <ListenerCard
                    key={listener.id}
                    {...listener}
                    onRequestSession={() => handleRequestSession(listener)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No listeners found"
                description="Check back soon for more trained listeners!"
                icon="🎧"
              />
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <SessionCard key={session.id} {...session} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No sessions scheduled"
                description="Schedule a session with a trained listener today!"
                icon="🗓️"
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Session Request Dialog */}
        <SessionRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          listener={selectedListener}
          onCreate={handleSessionCreate}
        />
      </div>
    </AccessGate>
  )
}
