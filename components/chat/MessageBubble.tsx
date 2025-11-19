"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Download, FileText } from "lucide-react"
import { linkifyText } from "@/lib/linkify"

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

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const getAttachmentType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return "image"
    }
    return "file"
  }

  const getFileName = (url: string) => {
    return url.split("/").pop() || "Unknown file"
  }

  const renderAttachment = (url: string, index: number) => {
    const type = getAttachmentType(url)

    if (type === "image") {
      return (
        <div key={index} className="mt-2">
          <img
            src={url || "/placeholder.svg"}
            alt="Attachment"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, "_blank")}
          />
        </div>
      )
    }

    return (
      <div
        key={index}
        className="mt-2 p-3 bg-white/40 rounded-lg border border-white/20 cursor-pointer hover:bg-white/60 transition-colors"
        onClick={() => window.open(url, "_blank")}
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700 truncate flex-1">{getFileName(url)}</span>
          <Download className="w-4 h-4 text-gray-500" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn("flex items-start space-x-3 mb-4", isOwn && "flex-row-reverse space-x-reverse")}
      aria-label={`Message from ${message.profiles.name} at ${formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.profiles.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
            {message.profiles.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={cn("max-w-xs lg:max-w-md", isOwn ? "ml-auto" : "mr-auto")}>
        {/* Sender name for received messages */}
        {!isOwn && <p className="text-xs text-gray-600 mb-1 ml-1">{message.profiles.name}</p>}

        {/* Message bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl shadow-sm",
            isOwn
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-white/60 backdrop-blur-md border border-white/40 text-gray-900 rounded-bl-md",
          )}
        >
          {/* Text content */}
          {message.body && (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: linkifyText(message.body),
              }}
            />
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">{message.attachments.map((url, index) => renderAttachment(url, index))}</div>
          )}
        </div>

        {/* Timestamp */}
        <p className={cn("text-xs text-gray-500 mt-1", isOwn ? "text-right mr-1" : "ml-1")}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
