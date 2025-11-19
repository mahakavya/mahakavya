"use client"

import type React from "react"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Send, MoreHorizontal } from "lucide-react"
import { useReelComments } from "@/hooks/drishya/useReelComments"
import { useCreateComment } from "@/hooks/drishya/useCreateComment"
import { useToggleCommentLike } from "@/hooks/drishya/useToggleCommentLike"
import { formatDistanceToNow } from "date-fns"
import { formatCount } from "@/lib/utils"

interface CommentSheetProps {
  reel: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CommentSheet({ reel, open, onOpenChange }: CommentSheetProps) {
  const [newComment, setNewComment] = useState("")

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useReelComments(reel.id)
  const createComment = useCreateComment(reel.id)
  const toggleCommentLike = useToggleCommentLike()

  const comments = data?.pages.flatMap((page) => page.items) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({ body: newComment.trim() })
      setNewComment("")
    } catch (error) {
      console.error("Comment error:", error)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      await toggleCommentLike.mutateAsync(commentId)
    } catch (error) {
      console.error("Comment like error:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] bg-white">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-center">{formatCount(reel.comment_count)} comments</SheetTitle>
        </SheetHeader>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  {comment.author.display_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm">{comment.author.display_name}</span>
                  <span className="text-gray-500 text-xs">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm text-gray-900 mb-2">{comment.body}</p>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => handleLikeComment(comment.id)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-500 p-0 h-auto"
                    disabled={toggleCommentLike.isPending}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${comment.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span className="text-xs">{comment.like_count > 0 ? formatCount(comment.like_count) : "Like"}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                    <span className="text-xs">Reply</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-0 h-auto">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasNextPage && (
            <div className="text-center py-4">
              <Button
                onClick={() => fetchNextPage()}
                variant="ghost"
                disabled={isFetchingNextPage}
                className="text-gray-500"
              >
                {isFetchingNextPage ? "Loading..." : "Load more comments"}
              </Button>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="border-t pt-4 flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">You</AvatarFallback>
          </Avatar>

          <div className="flex-1 flex space-x-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || createComment.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
