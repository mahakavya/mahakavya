"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { User, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Comment {
  id: string
  body: string
  created_at: string
  author: {
    id: string
    name: string
    avatar_url?: string
  }
}

interface CommentThreadProps {
  postId: string
}

export function CommentThread({ postId }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // TODO: Implement comment fetching
    setIsLoading(false)
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feed/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          body: newComment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      const { comment } = await response.json()
      setComments((prev) => [comment, ...prev])
      setNewComment("")

      toast({
        title: "Comment posted!",
        description: "Your comment has been added.",
      })
    } catch (error) {
      console.error("Comment error:", error)
      toast({
        title: "Failed to post comment",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/feed/comment/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete comment")
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId))

      toast({
        title: "Comment deleted",
        description: "Your comment has been removed.",
      })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Failed to delete comment",
        description: "Please try again later.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="glass" data-testid="comment-thread">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass" data-testid="comment-thread">
      <CardContent className="p-6 space-y-4">
        {/* Comment Composer */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px] resize-none"
            maxLength={600}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{newComment.length}/600</span>
            <Button type="submit" size="sm" disabled={!newComment.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Comment"
              )}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {comment.author.avatar_url ? (
                    <img
                      src={comment.author.avatar_url || "/placeholder.svg"}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      {comment.author.id === currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-600"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          <span className="sr-only">Delete comment</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-gray-900 text-sm">{comment.body}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
