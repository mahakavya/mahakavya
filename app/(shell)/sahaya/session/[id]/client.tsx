"use client"

import { useState } from "react"
import { SessionHeader } from "@/components/sahaya/SessionHeader"
import { SessionChat } from "@/components/sahaya/SessionChat"
import { useSahayaRealtime } from "@/lib/sahaya-realtime"

interface Session {
  id: string
  status: "requested" | "confirmed" | "completed" | "canceled"
  created_at: string
  listener_id: string
  seeker_id: string
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

interface SessionPageClientProps {
  session: Session
  currentUserId: string
}

export function SessionPageClient({ session: initialSession, currentUserId }: SessionPageClientProps) {
  const [session, setSession] = useState(initialSession)

  // Real-time session updates
  useSahayaRealtime({
    sessionId: session.id,
    onSession: (updatedSession) => {
      setSession((prev) => ({ ...prev, ...updatedSession }))
    },
  })

  const handleStatusChange = () => {
    // Status will be updated via real-time subscription
  }

  return (
    <div className="space-y-8">
      <SessionHeader session={session} currentUserId={currentUserId} onStatusChange={handleStatusChange} />

      <SessionChat sessionId={session.id} currentUserId={currentUserId} />
    </div>
  )
}
