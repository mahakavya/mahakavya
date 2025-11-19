"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { SlotEditor } from "@/components/sahaya/SlotEditor"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ListenerProfile {
  user_id: string
  bio: string
  expertise: string[]
  rating: number
  is_active: boolean
  created_at: string
}

export default function ListenerDashboardPage() {
  const [profile, setProfile] = useState<ListenerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/sahaya/me/listener")
        if (response.ok) {
          const data = await response.json()
          setProfile(data.listener)
        } else if (response.status === 404) {
          // Not a listener, redirect to main page
          router.push("/sahaya")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const toggleAvailability = async () => {
    if (!profile) return

    setIsUpdating(true)
    try {
      const response = await fetch("/api/sahaya/me/listener", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !profile.is_active,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.listener)
        toast({
          title: profile.is_active ? "You're now offline" : "You're now available",
          description: profile.is_active
            ? "Seekers won't be able to book new sessions with you"
            : "Seekers can now see and book your available slots",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Failed to update availability",
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
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!profile) {
    return null // Will redirect
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Listener Dashboard" subtitle="Manage your availability and help seekers find support" />

      {/* Status Card */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${profile.is_active ? "bg-green-500" : "bg-gray-400"}`} />
              <div>
                <h3 className="font-medium text-gray-900">
                  {profile.is_active ? "You're Available" : "You're Offline"}
                </h3>
                <p className="text-sm text-gray-600">
                  {profile.is_active
                    ? "Seekers can see and book your available slots"
                    : "Your profile is hidden from seekers"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Switch checked={profile.is_active} onCheckedChange={toggleAvailability} disabled={isUpdating} />
              <Button onClick={toggleAvailability} disabled={isUpdating} variant="outline" size="sm">
                {isUpdating ? "Updating..." : profile.is_active ? "Go Offline" : "Go Online"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Based on seeker feedback</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expertise Areas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.expertise.length}</div>
            <p className="text-xs text-muted-foreground">Areas you can help with</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
            <p className="text-xs text-muted-foreground">Helping the community</p>
          </CardContent>
        </Card>
      </div>

      {/* Slot Management */}
      <SlotEditor listenerId={profile.user_id} />

      {/* Best Practices */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Best Practices for Listeners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Creating a Safe Space</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Listen without judgment and avoid giving direct advice</li>
              <li>Maintain confidentiality - what's shared stays private</li>
              <li>Be present and give your full attention during sessions</li>
              <li>Respect boundaries and don't push for personal details</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Managing Your Availability</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Only add slots when you can be fully present</li>
              <li>Cancel or reschedule if something urgent comes up</li>
              <li>Take breaks to avoid burnout - your wellbeing matters too</li>
              <li>Set realistic time slots that work with your schedule</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">When to Refer</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>If someone mentions self-harm or suicide, encourage professional help</li>
              <li>For ongoing mental health issues, suggest speaking with a therapist</li>
              <li>Remember: you're providing support, not therapy</li>
              <li>It's okay to say "I think a professional could help you better"</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
