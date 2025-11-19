"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Minimize2, Maximize2, Trash2, Sparkles, User, Loader2 } from "lucide-react"
import { aiService, type AIMessage } from "@/lib/ai-service"
import { useAIContext } from "./AIContextProvider"
import { cn } from "@/lib/utils"

interface AISidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function AISidebar({ isOpen, onToggle }: AISidebarProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { context } = useAIContext()

  useEffect(() => {
    // Load existing conversation
    setMessages(aiService.getConversation())
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await aiService.sendMessage(userMessage)
      setMessages(aiService.getConversation())
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const handleClearConversation = () => {
    aiService.clearConversation()
    setMessages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestions = aiService.getSuggestions(context)

  if (!isOpen) return null

  return (
    <div className="fixed right-4 top-4 bottom-4 w-80 z-50">
      <Card
        className={cn(
          "h-full flex flex-col bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 shadow-xl",
          isMinimized && "h-auto",
        )}
      >
        <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="relative">
                <Bot className="w-5 h-5" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
              AI Assistant
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                ×
              </Button>
            </div>
          </div>
          {context && (
            <Badge variant="secondary" className="w-fit bg-white/20 text-white border-white/30">
              {context.page} page
            </Badge>
          )}
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                        <Bot className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">Welcome to AI Assistant!</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        I'm here to help you navigate Mahakavya and answer your questions.
                      </p>
                      <div className="space-y-2">
                        {suggestions.slice(0, 2).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left justify-start text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                          message.role === "user"
                            ? "bg-orange-500 text-white ml-auto"
                            : "bg-white border border-orange-200 text-gray-900",
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-orange-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Suggestions */}
              {messages.length > 0 && suggestions.length > 0 && (
                <>
                  <Separator />
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs h-7 px-2"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Input Area */}
              <Separator />
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearConversation}
                    className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear conversation
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
