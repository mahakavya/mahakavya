"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Plus, Calendar } from "lucide-react"

interface CampaignUpdate {
  id: string
  title: string
  content: string
  media_url?: string
  created_at: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface CampaignUpdatesProps {
  campaignId: string
  isOwner: boolean
}

export function CampaignUpdates({ campaignId, isOwner }: CampaignUpdatesProps) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch(`/api/fundraising/campaigns/${campaignId}/updates`)
        if (response.ok) {
          const data = await response.json()
          setUpdates(data.items || [])
        }
      } catch (error) {
        console.error("Failed to fetch updates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUpdates()
  }, [campaignId])

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/fundraising/campaigns/${campaignId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUpdate),
      })

      if (response.ok) {
        const update = await response.json()
        setUpdates((prev) => [update, ...prev])
        setNewUpdate({ title: "", content: "" })
        setShowAddForm(false)
        toast({
          title: "Update posted",
          description: "Your campaign update has been published successfully.",
        })
      } else {
        throw new Error("Failed to post update")
      }
    } catch (error) {
      toast({
        title: "Failed to post update",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Update Form (Owner Only) */}
      {isOwner && (
        <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Campaign Updates</CardTitle>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              )}
            </div>
          </CardHeader>
          {showAddForm && (
            <CardContent className="pt-0">
              <form onSubmit={handleSubmitUpdate} className="space-y-4">
                <Input
                  placeholder="Update title"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
                <Textarea
                  placeholder="Share an update with your supporters..."
                  value={newUpdate.content}
                  onChange={(e) => setNewUpdate((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post Update"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewUpdate({ title: "", content: "" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {/* Updates List */}
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
        <CardContent className="p-6">
          {updates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No updates yet</p>
              <p className="text-xs">Check back later for campaign updates</p>
            </div>
          ) : (
            <div className="space-y-6">
              {updates.map((update) => (
                <div key={update.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={update.author.avatar_url || "/placeholder.svg"} alt={update.author.name} />
                      <AvatarFallback className="text-xs">{update.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{update.title}</h4>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{update.content}</p>
                      {update.media_url && (
                        <div className="mt-3">
                          <img
                            src={update.media_url || "/placeholder.svg"}
                            alt="Update media"
                            className="rounded-lg max-w-full h-auto"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
