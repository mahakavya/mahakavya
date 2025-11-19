"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Post {
  id: string;
  user_id: string;
  caption: string;
  image_url: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes: Array<{ user_id: string }>;
  comments: Array<{
    id: string;
    content: string;
    user_id: string;
    profiles: {
      username: string;
      display_name: string;
    };
  }>;
}

interface FeedPostProps {
  post: Post;
  currentUserId: string;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

export function FeedPost({
  post,
  currentUserId,
  onLikeToggle,
}: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoadingComment, setIsLoadingComment] = useState(false);

  const isLiked = post.likes.some((like) => like.user_id === currentUserId);
  const likeCount = post.likes.length;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsLoadingComment(true);
    const supabase = createClient();

    try {
      await supabase.from("comments").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: commentText,
      });
      setCommentText("");
      // Refresh would happen through parent component
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoadingComment(false);
    }
  };

  const handleLike = async () => {
    const supabase = createClient();
    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
      } else {
        await supabase.from("likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });
      }
      onLikeToggle(post.id, !isLiked);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {post.profiles.avatar_url ? (
              <img
                src={post.profiles.avatar_url || "/placeholder.svg"}
                alt={post.profiles.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              post.profiles.display_name?.charAt(0) || "U"
            )}
          </div>
          <Link href={`/profile/${post.profiles.username}`}>
            <div className="cursor-pointer">
              <p className="font-semibold text-sm">{post.profiles.display_name}</p>
              <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
            </div>
          </Link>
        </div>

        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          <img
            src={post.image_url || "/placeholder.svg"}
            alt={post.caption || "Post"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className="hover:bg-transparent"
          >
            <Heart
              className={`w-6 h-6 ${
                isLiked ? "fill-destructive text-destructive" : ""
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="hover:bg-transparent"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-transparent">
            <Share2 className="w-6 h-6" />
          </Button>
        </div>

        {/* Caption and Stats */}
        <div className="px-4 pb-3">
          {likeCount > 0 && (
            <p className="text-sm font-semibold mb-2">{likeCount} likes</p>
          )}
          {post.caption && (
            <p className="text-sm">
              <span className="font-semibold mr-1">{post.profiles.display_name}</span>
              {post.caption}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">{formattedDate}</p>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t p-4 space-y-3">
            {post.comments.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="text-sm">
                    <p>
                      <span className="font-semibold">{comment.profiles.display_name}</span>{" "}
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || isLoadingComment}
              >
                Post
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
