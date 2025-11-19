"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Users,
  Settings,
  Phone,
  Video,
  Search,
  Reply,
  Bot,
  Shield,
  Zap,
} from "lucide-react"

interface Group {
  id: string
  name: string
  description: string
  avatar_url: string | null
  member_count: number
  privacy: "public" | "private" | "secret"
  created_at: string
  created_by: string
  is_admin: boolean
  last_activity: string
  ai_enabled: boolean
  blockchain_verified: boolean
  rpa_automated: boolean
  engagement_score: number
  category: string
}

interface Message {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  content: string
  timestamp: string
  message_type: "text" | "image" | "file" | "system"
  reply_to?: string
  is_edited: boolean
  ai_enhanced: boolean
  blockchain_verified: boolean
  reactions: Array<{ emoji: string; count: number; users: string[] }>
}

interface GroupMember {
  id: string
  name: string
  avatar_url: string | null
  role: "admin" | "moderator" | "member"
  last_seen: string
  is_online: boolean
}

interface GroupChatInterfaceProps {
  group: Group
}

export function GroupChatInterface({ group }: GroupChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<GroupMember[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [showMembers, setShowMembers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    fetchMembers()
    // Set up real-time message updates
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [group.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/groups/${group.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/chat/groups/${group.id}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/chat/groups/${group.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          message_type: "text",
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])
        setNewMessage("")
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/groups/${group.id}/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      })

      if (response.ok) {
        await fetchMessages()
      }
    } catch (error) {
      console.error("Error adding reaction:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {}
    messages.forEach((message) => {
      const date = formatDate(message.timestamp)
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(message)
    })
    return grouped
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="flex h-[calc(100vh-200px)] bg-background">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={group.avatar_url || ""} />
              <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{group.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{group.member_count} members</span>
                {group.ai_enabled && (
                  <Badge variant="secondary" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                )}
                {group.blockchain_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {group.rpa_automated && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowMembers(!showMembers)}>
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center justify-center my-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">{date}</div>
                </div>

                {dateMessages.map((message, index) => {
                  const showAvatar = index === 0 || dateMessages[index - 1]?.user_id !== message.user_id
                  const isLastFromUser =
                    index === dateMessages.length - 1 || dateMessages[index + 1]?.user_id !== message.user_id

                  return (
                    <div key={message.id} className={`flex gap-3 ${showAvatar ? "mt-4" : "mt-1"}`}>
                      <div className="w-10">
                        {showAvatar && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.user_avatar || ""} />
                            <AvatarFallback className="text-xs">{message.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{message.user_name}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            {message.ai_enhanced && (
                              <Badge variant="outline" className="text-xs">
                                <Bot className="h-2 w-2 mr-1" />
                                AI
                              </Badge>
                            )}
                            {message.blockchain_verified && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-2 w-2 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        )}

                        <div
                          className={`group relative bg-muted/50 rounded-lg px-3 py-2 hover:bg-muted/70 transition-colors ${
                            selectedMessage === message.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                          {message.is_edited && <span className="text-xs text-muted-foreground ml-2">(edited)</span>}

                          {/* Reactions */}
                          {message.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => addReaction(message.id, reaction.emoji)}
                                >
                                  {reaction.emoji} {reaction.count}
                                </Button>
                              ))}
                            </div>
                          )}

                          {/* Message Actions */}
                          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 bg-background border rounded-md shadow-sm">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => addReaction(message.id, "👍")}
                              >
                                <Smile className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Reply className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${group.name}...`}
                disabled={isSending}
                className="min-h-[40px] resize-none"
              />
            </div>
            <Button variant="ghost" size="sm">
              <Smile className="h-4 w-4" />
            </Button>
            <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="w-80 border-l bg-muted/20">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Members ({members.length})</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url || ""} />
                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {member.is_online && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      {member.role === "admin" && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      {member.role === "moderator" && (
                        <Badge variant="outline" className="text-xs">
                          Mod
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.is_online ? "Online" : `Last seen ${new Date(member.last_seen).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
