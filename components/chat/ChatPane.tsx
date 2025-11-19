"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { MessageBubble } from "./MessageBubble"
import { MessageComposer } from "./MessageComposer"
import { TypingDots } from "./TypingDots"
import { useChatRealtime } from "@/lib/chat-realtime"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  body: string | null
  attachments: string[] | null
  created_at: string
  sender_id: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  }
}

interface ChatPaneProps {
  conversationId?: string
  onBack?: () => void
  currentUserId?: string
}

export function ChatPane({ conversationId, onBack, currentUserId }: ChatPaneProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [members, setMembers] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Load messages
  const loadMessages = useCallback(
    async (cursor?: string) => {
      if (!conversationId) return

      setLoading(true)
      try {
        const params = new URLSearchParams({
          conversationId,
          limit: "30",
        })
        if (cursor) params.set("cursor", cursor)

        const response = await fetch(`/api/chat/messages?${params}`)
        if (response.ok) {
          const data = await response.json()

          if (cursor) {
            // Loading older messages
            setMessages((prev) => [...data.items, ...prev])
          } else {
            // Initial load
            setMessages(data.items)
            setTimeout(scrollToBottom, 100)
          }

          setHasMore(!!data.nextCursor)
        } else {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Network Error",
          description: "Please check your connection",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [conversationId, toast, scrollToBottom],
  )

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return

    try {
      await fetch("/api/chat/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      })
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }, [conversationId])

  // Realtime handlers
  const handleNewMessage = useCallback(
    (message: any) => {
      setMessages((prev) => [...prev, message])
      setTimeout(scrollToBottom, 100)
    },
    [scrollToBottom],
  )

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }, [])

  const handleTyping = useCallback(
    (userId: string, isTyping: boolean) => {
      if (userId === currentUserId) return // Don't show own typing

      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(userId) ? prev : [...prev, userId]
        } else {
          return prev.filter((id) => id !== userId)
        }
      })
    },
    [currentUserId],
  )

  // Setup realtime
  useChatRealtime(conversationId || "", {
    onMessage: handleNewMessage,
    onDelete: handleDeleteMessage,
    onTyping: handleTyping,
  })

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setMessages([])
      setTypingUsers([])
      loadMessages()
      markAsRead()
    }
  }, [conversationId, loadMessages, markAsRead])

  // Mark as read when focused
  useEffect(() => {
    const handleFocus = () => {
      if (conversationId) {
        markAsRead()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [conversationId, markAsRead])

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          title="Select a conversation"
          subtitle="Choose a conversation from the list or start a new one to begin messaging."
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">Chat</h2>
              <p className="text-sm text-gray-600">{members.length > 0 ? `${members.length} members` : "Loading..."}</p>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} isOwn={message.sender_id === currentUserId} />
            ))}

            {/* Typing Indicator */}
            <TypingDots users={typingUsers} />

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId}
        onMessageSent={() => {
          scrollToBottom()
          markAsRead()
        }}
      />
    </div>
  )
}
