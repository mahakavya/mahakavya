"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePost, useCreateComment, useToggleCommentLike } from "@/hooks/useSamvaaha"
import { useAuth } from "@/hooks/use-auth"
import type { Comment } from "@/lib/supabase/types"
import { formatDistanceToNow } from "date-fns"
import { Heart, Loader2, MoreHorizontal, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { linkifyText } from "@/lib/sanitize"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FlagDialog } from "./FlagDialog"

interface CommentThreadProps {
  postId: string
}

interface CommentItemProps {
  comment: Comment
  postId: string
}

function CommentItem({ comment, postId }: CommentItemProps) {
  const { user } = useAuth()
  const toggleCommentLike = useToggleCommentLike(comment.id, postId)
  const [showFlagDialog, setShowFlagDialog] = useState(false)

  const handleLike = async () => {
    try {
      await toggleCommentLike.mutateAsync()
    } catch (error) {
      toast.error("Failed to update like")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 py-2">
      <Avatar className="h-8 w-8 ring-1 ring-white/20">
        <AvatarImage src={comment.author.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{comment.author.display_name[0] || "U"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.display_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: linkifyText(comment.body),
            }}
          />
        </div>

        <div className="flex items-center gap-2 mt-1 ml-3">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${comment.viewerHasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
            onClick={handleLike}
            disabled={toggleCommentLike.isPending}
          >
            {toggleCommentLike.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Heart className={`h-3 w-3 mr-1 ${comment.viewerHasLiked ? "fill-current" : ""}`} />
            )}
            {comment.like_count > 0 && comment.like_count}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowFlagDialog(true)}>Report comment</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <FlagDialog open={showFlagDialog} onOpenChange={setShowFlagDialog} contentType="comment" contentId={comment.id} />
    </motion.div>
  )
}

export function CommentThread({ postId }: CommentThreadProps) {
  const { user } = useAuth()
  const { data, isLoading } = usePost(postId)
  const createComment = useCreateComment(postId)
  const [commentBody, setCommentBody] = useState("")

  const handleSubmit = async () => {
    if (!commentBody.trim()) return

    try {
      await createComment.mutateAsync({ body: commentBody.trim() })
      setCommentBody("")
      toast.success("Comment posted!")
    } catch (error) {
      toast.error("Failed to post comment")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-8 w-8 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-1/4 mb-2" />
              <div className="h-3 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* Comment Composer */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 ring-1 ring-white/20">
            <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {user.user_metadata?.display_name?.[0] || user.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] resize-none text-sm"
              maxLength={1000}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Press Cmd+Enter to post</span>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createComment.isPending || !commentBody.trim()}
                className="h-7 px-3"
              >
                {createComment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        <AnimatePresence>
          {data.comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </AnimatePresence>

        {data.comments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  )
}
