"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { SessionChat } from "@/components/sahaya/SessionChat"
import { SessionHeader } from "@/components/sahaya/SessionHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAI } from "@/hooks/useAI"
import { useBlockchainVerification } from "@/hooks/useBlockchainVerification"
import { useRPA } from "@/hooks/useRPA"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Session {
  id: string
  listener_id: string
  user_id: string
  start_time: string
  end_time: string
  status: "scheduled" | "ongoing" | "completed" | "cancelled"
}

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { generateSessionSummary } = useAI()
  const { verifySessionData } = useBlockchainVerification()
  const { automateSessionTasks } = useRPA()

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      try {
        // Simulate fetching session data
        const response = await fetch(`/api/sahaya/sessions/${sessionId}`)
        if (!response.ok) {
          throw new Error("Failed to load session")
        }
        const data = await response.json()
        setSession(data)
      } catch (error) {
        console.error("Failed to load session:", error)
        toast({
          title: "Error",
          description: "Failed to load session details",
          variant: "destructive",
        })
        router.push("/sahaya")
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      fetchSession()
    }
  }, [sessionId, router, toast])

  const handleSessionEnd = async () => {
    try {
      // Generate session summary using AI
      const summary = await generateSessionSummary("Session topic")

      // Verify session data using blockchain
      const isVerified = await verifySessionData(session)

      // Automate session tasks using RPA
      await automateSessionTasks(session)

      toast({
        title: "Success!",
        description: "Session ended successfully",
      })
      router.push("/sahaya")
    } catch (error) {
      console.error("Session end error:", error)
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-600">The session you're looking for doesn't exist or is no longer available.</p>
          <Button asChild>
            <Link href="/sahaya">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sahaya
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader
        title="Emotional Support Session"
        subtitle="Connect with trained listeners for mental health and emotional wellbeing"
      />

      <SessionHeader session={session} />

      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <SessionChat sessionId={sessionId} />
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSessionEnd}>End Session</Button>
      </div>
    </div>
  )
}
