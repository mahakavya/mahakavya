"use client"

import { useState } from "react"
import { Plus, Mail, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface NewConversationDialogProps {
  onSelect: (conversationId: string) => void
}

export function NewConversationDialog({ onSelect }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [peerEmail, setPeerEmail] = useState("")
  const [groupTitle, setGroupTitle] = useState("")
  const [memberIds, setMemberIds] = useState("")
  const { toast } = useToast()

  const handleCreateDirect = async () => {
    if (!peerEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          peerEmail: peerEmail.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSelect(data.conversation.id)
        setOpen(false)
        setPeerEmail("")
        toast({
          title: "Success",
          description: "Direct chat created",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create chat",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group title",
        variant: "destructive",
      })
      return
    }

    // Parse member IDs (simple implementation - in real app, you'd have a proper member selector)
    const memberIdList = memberIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    if (memberIdList.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one member",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          title: groupTitle.trim(),
          memberIds: memberIdList,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSelect(data.conversation.id)
        setOpen(false)
        setGroupTitle("")
        setMemberIds("")
        toast({
          title: "Success",
          description: "Group chat created",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create group",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-white/60 backdrop-blur-md border-white/40 hover:bg-white/80">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white/90 backdrop-blur-md border-white/40">
        <DialogHeader>
          <DialogTitle>Start a New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Direct
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="peer-email">Email Address</Label>
              <Input
                id="peer-email"
                type="email"
                placeholder="Enter email address"
                value={peerEmail}
                onChange={(e) => setPeerEmail(e.target.value)}
                className="bg-white/60 backdrop-blur-md border-white/40"
              />
            </div>
            <Button onClick={handleCreateDirect} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Start Direct Chat"}
            </Button>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-title">Group Title</Label>
              <Input
                id="group-title"
                placeholder="Enter group name"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="bg-white/60 backdrop-blur-md border-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-ids">Member IDs</Label>
              <Textarea
                id="member-ids"
                placeholder="Enter member IDs separated by commas"
                value={memberIds}
                onChange={(e) => setMemberIds(e.target.value)}
                className="bg-white/60 backdrop-blur-md border-white/40"
              />
              <p className="text-xs text-gray-500">
                Enter user IDs separated by commas (temporary - will be improved with user search)
              </p>
            </div>
            <Button onClick={handleCreateGroup} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Group Chat"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
