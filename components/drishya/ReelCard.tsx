"use client"

import { useState } from "react"
import { ReelPlayer } from "./ReelPlayer"
import { RightRail } from "./RightRail"
import { Caption } from "./Caption"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProgressBadge } from "./ProgressBadge"
import { UserPlus, Music } from "lucide-react"
import { useToggleFollow } from "@/hooks/useToggleFollow"

interface Reel {
  id: string
  author_id: string
  caption?: string
  tags: string[]
  hls_url?: string
  thumb_url?: string
  status: "PROCESSING" | "READY" | "FAILED"
  likes_count: number
  comments_count: number
  views_count: number
  duration_seconds?: number
  audio_title?: string
  audio_url?: string
  created_at: string
  author: {
    id: string
    username: string
    display_name: string
    avatar_url?: string
  }
  is_liked: boolean
  is_bookmarked: boolean
  is_following: boolean
}

interface ReelCardProps {
  reel: Reel
  isActive: boolean
  onCommentClick?: (reelId: string) => void
}

export function ReelCard({ reel, isActive, onCommentClick }: ReelCardProps) {
  const [showControls, setShowControls] = useState(false)
  const { mutate: toggleFollow } = useToggleFollow()

  const handleFollowClick = () => {
    toggleFollow({ userId: reel.author_id })
  }

  const handleDoubleClick = () => {
    // Handle like on double tap
    console.log("Double tap like for reel:", reel.id)
  }

  return (
    <div
      className="relative h-full w-full bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Player */}
      {reel.status === "READY" && reel.hls_url ? (
        <ReelPlayer
          src={reel.hls_url}
          poster={reel.thumb_url}
          isActive={isActive}
          onDoubleClick={handleDoubleClick}
          showControls={showControls}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-900">
          {reel.thumb_url ? (
            <img
              src={reel.thumb_url || "/placeholder.svg"}
              alt="Video thumbnail"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-white text-center">
              <div className="text-4xl mb-4">🎬</div>
              <ProgressBadge reelId={reel.id} />
            </div>
          )}
        </div>
      )}

      {/* Overlay Content */}
      <div className="absolute inset-0 flex">
        {/* Left side - Author info and caption */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-20">
          {/* Author info */}
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-white">
              <AvatarImage src={reel.author.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-purple-600 text-white">
                {reel.author.display_name?.[0] || reel.author.username[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-semibold text-sm">@{reel.author.username}</h3>
                {!reel.is_following && (
                  <Button
                    size="sm"
                    onClick={handleFollowClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-6 px-2 text-xs"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Follow
                  </Button>
                )}
              </div>
              <p className="text-gray-300 text-xs">{reel.author.display_name}</p>
            </div>
          </div>

          {/* Caption */}
          {reel.caption && <Caption text={reel.caption} className="mb-3" />}

          {/* Audio info */}
          {reel.audio_title && (
            <div className="flex items-center space-x-2 mb-3">
              <Music className="w-4 h-4 text-white" />
              <span className="text-white text-sm truncate">{reel.audio_title}</span>
            </div>
          )}

          {/* Tags */}
          {reel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {reel.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-black/50 text-white text-xs">
                  #{tag}
                </Badge>
              ))}
              {reel.tags.length > 3 && (
                <Badge variant="secondary" className="bg-black/50 text-white text-xs">
                  +{reel.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <RightRail reel={reel} onCommentClick={() => onCommentClick?.(reel.id)} />
      </div>

      {/* Processing overlay */}
      {reel.status === "PROCESSING" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm">Processing video...</p>
            <ProgressBadge reelId={reel.id} />
          </div>
        </div>
      )}

      {/* Failed overlay */}
      {reel.status === "FAILED" && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm">Failed to process video</p>
          </div>
        </div>
      )}
    </div>
  )
}
