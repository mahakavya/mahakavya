"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { MessageComposer } from "@/components/chat/MessageComposer"
import { useChatRealtime } from "@/lib/chat-realtime"

interface Message {
  id: string
  body: string
  attachments?: string[]
  created_at: string
  sender_id: string
  profiles: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface SessionChatProps {
  sessionId: string
  currentUserId: string
}

export function SessionChat({ sessionId, currentUserId }: SessionChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Fetch messages
  const fetchMessages = async (cursor?: string) => {
    try {
      const url = new URL("/api/chat/messages", window.location.origin)
      url.searchParams.set("sessionId", sessionId)
      if (cursor) url.searchParams.set("cursor", cursor)

      const response = await fetch(url.toString())
      if (response.ok) {
        const data = await response.json()

        if (cursor) {
          // Loading older messages
          setMessages((prev) => [...data.items, ...prev])
        } else {
          // Initial load
          setMessages(data.items)
          scrollToBottom()
        }

        setHasMore(!!data.nextCursor)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [sessionId])

  // Real-time message updates
  useChatRealtime(`session:${sessionId}`, {
    onMessage: (message) => {
      setMessages((prev) => [...prev, message])
      scrollToBottom()
    },
    onDelete: (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    },
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleMessageSent = () => {
    // Message will be added via real-time subscription
    scrollToBottom()
  }

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Session Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm h-[600px] flex flex-col"
      data-testid="session-chat"
    >
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Session Chat</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation with your session partner</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={{
                    id: message.id,
                    body: message.body,
                    attachments: message.attachments,
                    created_at: message.created_at,
                    author: {
                      id: message.profiles.id,
                      name: message.profiles.name,
                      avatar_url: message.profiles.avatar_url,
                    },
                  }}
                  isOwn={message.sender_id === currentUserId}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Composer */}
        <div className="flex-shrink-0">
          <MessageComposer
            conversationId="" // Not used for session messages
            sessionId={sessionId}
            onMessageSent={handleMessageSent}
          />
        </div>
      </CardContent>
    </Card>
  )
}
