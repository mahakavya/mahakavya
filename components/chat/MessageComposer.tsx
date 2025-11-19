"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Send, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { uploadChatAttachment } from "@/lib/storage"
import { cn } from "@/lib/utils"

interface MessageComposerProps {
  conversationId: string
  onMessageSent?: () => void
}

interface AttachmentPreview {
  file: File
  url: string
  uploading: boolean
  uploadedPath?: string
}

export function MessageComposer({ conversationId, onMessageSent }: MessageComposerProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([])
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          isTyping: true,
        }),
      }).catch(console.error)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          isTyping: false,
        }),
      }).catch(console.error)
    }, 2000)
  }, [conversationId, isTyping])

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (isTyping) {
      setIsTyping(false)
      fetch("/api/chat/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          isTyping: false,
        }),
      }).catch(console.error)
    }
  }, [conversationId, isTyping])

  const handleFileSelect = async (files: FileList) => {
    const newAttachments: AttachmentPreview[] = []

    for (let i = 0; i < Math.min(files.length, 5 - attachments.length); i++) {
      const file = files[i]
      const preview: AttachmentPreview = {
        file,
        url: URL.createObjectURL(file),
        uploading: true,
      }
      newAttachments.push(preview)
    }

    setAttachments((prev) => [...prev, ...newAttachments])

    // Upload files
    for (const attachment of newAttachments) {
      try {
        const result = await uploadChatAttachment(attachment.file, "current-user-id") // TODO: Get current user ID
        setAttachments((prev) =>
          prev.map((a) => (a.file === attachment.file ? { ...a, uploading: false, uploadedPath: result.path } : a)),
        )
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${attachment.file.name}`,
          variant: "destructive",
        })
        setAttachments((prev) => prev.filter((a) => a.file !== attachment.file))
      }
    }
  }

  const removeAttachment = (file: File) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.file === file)
      if (attachment) {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter((a) => a.file !== file)
    })
  }

  const handleSend = async () => {
    const trimmedMessage = message.trim()
    const uploadedAttachments = attachments.filter((a) => !a.uploading && a.uploadedPath).map((a) => a.uploadedPath!)

    if (!trimmedMessage && uploadedAttachments.length === 0) {
      return
    }

    setSending(true)
    handleTypingStop()

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          body: trimmedMessage || undefined,
          attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        }),
      })

      if (response.ok) {
        setMessage("")
        setAttachments([])
        onMessageSent?.()

        // Focus back to textarea
        textareaRef.current?.focus()
      } else {
        const error = await response.json()
        toast({
          title: "Failed to send message",
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
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = (message.trim() || attachments.some((a) => !a.uploading)) && !sending

  return (
    <div className="p-4 border-t border-white/20 bg-white/40 backdrop-blur-md" data-testid="message-composer">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="relative bg-white/60 backdrop-blur-md border border-white/40 rounded-lg p-2 flex items-center space-x-2"
            >
              {attachment.file.type.startsWith("image/") ? (
                <img
                  src={attachment.url || "/placeholder.svg"}
                  alt="Preview"
                  className="w-8 h-8 object-cover rounded"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <span className="text-sm text-gray-700 truncate max-w-[100px]">{attachment.file.name}</span>
              {attachment.uploading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={() => removeAttachment(attachment.file)}
                className="text-gray-500 hover:text-red-500 transition-colors"
                disabled={attachment.uploading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              handleTypingStart()
            }}
            onBlur={handleTypingStop}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none bg-white/60 backdrop-blur-md border-white/40 pr-12"
            disabled={sending}
          />

          {/* Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            disabled={sending || attachments.length >= 5}
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className={cn(
            "h-11 px-4 transition-all",
            canSend ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed",
          )}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />
    </div>
  )
}
