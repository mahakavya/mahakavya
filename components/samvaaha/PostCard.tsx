"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MediaGrid } from "./MediaGrid"
import { ActionBar } from "./ActionBar"
import { CommentThread } from "./CommentThread"
import { FlagDialog } from "./FlagDialog"
import type { Post } from "@/lib/supabase/types"
import { formatDistanceToNow } from "date-fns"
import { Globe, Users, Lock, MoreHorizontal } from "lucide-react"
import { linkifyText } from "@/lib/sanitize"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: Post
  showComments?: boolean
  onCommentClick?: () => void
}

export function PostCard({ post, showComments = false, onCommentClick }: PostCardProps) {
  const [showCommentsState, setShowCommentsState] = useState(showComments)
  const [showFlagDialog, setShowFlagDialog] = useState(false)

  const visibilityIcons = {
    PUBLIC: <Globe className="h-3 w-3" />,
    FOLLOWERS: <Users className="h-3 w-3" />,
    PRIVATE: <Lock className="h-3 w-3" />,
  }

  const handleCommentClick = () => {
    if (onCommentClick) {
      onCommentClick()
    } else {
      setShowCommentsState(!showCommentsState)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full backdrop-blur-sm bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white/20">
                <AvatarImage src={post.author.avatar_url || undefined} />
                <AvatarFallback>{post.author.display_name[0] || "U"}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{post.author.display_name}</h3>
                  <div className="flex items-center gap-1">
                    {visibilityIcons[post.visibility]}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowFlagDialog(true)}>Report post</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {post.body && (
            <div
              className="text-sm mb-3 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: linkifyText(post.body),
              }}
            />
          )}

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <MediaGrid mediaUrls={post.media_urls} mediaTypes={post.media_types} />
          )}

          {/* Action Bar */}
          <ActionBar post={post} onCommentClick={handleCommentClick} />

          {/* Comments */}
          {showCommentsState && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border/50"
            >
              <CommentThread postId={post.id} />
            </motion.div>
          )}
        </CardContent>
      </Card>

      <FlagDialog open={showFlagDialog} onOpenChange={setShowFlagDialog} contentType="post" contentId={post.id} />
    </motion.div>
  )
}
