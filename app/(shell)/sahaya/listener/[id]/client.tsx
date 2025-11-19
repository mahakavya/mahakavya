"use client"

import { useState } from "react"
import { Star, Heart, Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SlotList } from "@/components/sahaya/SlotList"
import { SessionRequestDialog } from "@/components/sahaya/SessionRequestDialog"

interface Listener {
  id: string
  name: string
  avatar_url?: string
  bio: string
  expertise: string[]
  rating: number
  is_active: boolean
  created_at: string
}

interface ListenerProfileClientProps {
  listener: Listener
}

export function ListenerProfileClient({ listener }: ListenerProfileClientProps) {
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string
    start: string
    end: string
  } | null>(null)

  const handleSlotSelect = async (slotId: string) => {
    try {
      // Fetch slot details
      const response = await fetch(`/api/sahaya/slots/${slotId}`)
      if (response.ok) {
        const slot = await response.json()
        setSelectedSlot({
          id: slot.id,
          start: slot.start_at,
          end: slot.end_at,
        })
      }
    } catch (error) {
      console.error("Error fetching slot:", error)
    }
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm p-8">
        <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <Avatar className="w-24 h-24 border-4 border-white/40">
            <AvatarImage src={listener.avatar_url || "/placeholder.svg"} alt={listener.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-2xl">
              <User className="w-12 h-12 text-gray-600" />
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{listener.name}</h1>
              <div className="flex items-center space-x-1 text-amber-600">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-medium">{listener.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Expertise */}
            <div className="flex flex-wrap gap-2 mb-4">
              {listener.expertise.map((skill, index) => (
                <Badge key={index} className="bg-blue-50 text-blue-700 border-blue-200">
                  {skill}
                </Badge>
              ))}
            </div>

            {/* Meta */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Active Listener</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJoinDate(listener.created_at)}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">{listener.bio}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Additional Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5" />
                <span>About Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What to Expect</h4>
                <ul className="space-y-1">
                  <li>• Safe, confidential conversations</li>
                  <li>• Non-judgmental listening</li>
                  <li>• Emotional support and guidance</li>
                  <li>• Professional boundaries maintained</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Session Guidelines</h4>
                <ul className="space-y-1">
                  <li>• Sessions are 15 minutes to 2 hours</li>
                  <li>• Request at least 10 minutes in advance</li>
                  <li>• Listener will confirm your request</li>
                  <li>• Cancel if you can't make it</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Availability */}
        <div className="lg:col-span-2">
          <SlotList listenerId={listener.id} onSlotSelect={handleSlotSelect} />
        </div>
      </div>

      {/* Session Request Dialog */}
      {selectedSlot && (
        <SessionRequestDialog
          slotId={selectedSlot.id}
          slotTime={{
            start: selectedSlot.start,
            end: selectedSlot.end,
          }}
          listenerName={listener.name}
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
        />
      )}
    </div>
  )
}
