"use client"

import { useState, useEffect } from "react"
import { Search, Users, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Conversation {
  id: string
  title: string | null
  is_group: boolean
  last_message: {
    body: string
    created_at: string
    has_attachments: boolean
  } | null
  unread_count: number
  members: Array<{
    id: string
    name: string
    avatar_url: string | null
  }>
}

interface ConversationListProps {
  selectedId?: string
  onSelect: (id: string) => void
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true

    const searchLower = searchQuery.toLowerCase()

    // Search by title for groups
    if (conv.is_group && conv.title) {
      return conv.title.toLowerCase().includes(searchLower)
    }

    // Search by member names
    return conv.members.some((member) => member.name.toLowerCase().includes(searchLower))
  })

  const getConversationTitle = (conv: Conversation) => {
    if (conv.is_group) {
      return conv.title || "Group Chat"
    }

    // For direct chats, show the other person's name
    const otherMember = conv.members.find((member) => member.id !== "current-user-id") // TODO: Get current user ID
    return otherMember?.name || "Direct Chat"
  }

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.is_group) {
      return null // Will show group icon
    }

    const otherMember = conv.members.find((member) => member.id !== "current-user-id") // TODO: Get current user ID
    return otherMember?.avatar_url || null
  }

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.last_message) return "No messages yet"

    if (conv.last_message.has_attachments && !conv.last_message.body) {
      return "📎 Attachment"
    }

    return conv.last_message.body || "📎 Attachment"
  }

  if (loading) {
    return (
      <div className="space-y-4" data-testid="conversation-list">
        <div className="p-4">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="conversation-list">
      {/* Search */}
      <div className="p-4 border-b border-white/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/60 backdrop-blur-md border-white/40"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full p-4 text-left hover:bg-white/40 transition-colors",
                  "focus:outline-none focus:bg-white/40",
                  selectedId === conv.id && "bg-white/60 backdrop-blur-md",
                )}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getConversationAvatar(conv) || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {conv.is_group ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unread_count > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs flex items-center justify-center p-0"
                      >
                        {conv.unread_count > 99 ? "99+" : conv.unread_count}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{getConversationTitle(conv)}</h3>
                      {conv.last_message && (
                        <span className="text-xs text-gray-500 ml-2">
                          {formatDistanceToNow(new Date(conv.last_message.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{getLastMessagePreview(conv)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
