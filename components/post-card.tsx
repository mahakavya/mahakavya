"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from 'lucide-react';
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

interface PostCardProps {
  post: any;
  currentUserId: string;
  onLikeChange?: () => void;
}

export function PostCard({ post, currentUserId, onLikeChange }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes?.[0]?.count || 0);
  const supabase = createClient();

  const handleLike = async () => {
    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUserId);
      setLikeCount(Math.max(0, likeCount - 1));
    } else {
      await supabase.from("likes").insert({
        post_id: post.id,
        user_id: currentUserId,
      });
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
    onLikeChange?.();
  };

  return (
    <Card className="overflow-hidden">
      {/* Post Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Image
          src={post.profiles.avatar_url || "/placeholder.svg?height=40&width=40&query=avatar"}
          alt={post.profiles.display_name}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <Link href={`/profile/${post.user_id}`} className="font-semibold hover:underline">
            {post.profiles.display_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {post.profiles.username}
          </p>
        </div>
      </div>

      {/* Post Image */}
      <div className="relative w-full aspect-square">
        <Image
          src={post.image_url || "/placeholder.svg"}
          alt={post.caption}
          fill
          className="object-cover"
        />
      </div>

      {/* Post Actions */}
      <div className="p-4 border-b border-border flex gap-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <Heart
            className={`w-6 h-6 ${liked ? "fill-primary text-primary" : ""}`}
          />
          <span className="text-sm">{likeCount}</span>
        </button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm">{post.comments?.[0]?.count || 0}</span>
        </Link>
      </div>

      {/* Post Caption */}
      {post.caption && (
        <div className="p-4">
          <p className="text-sm">
            <Link href={`/profile/${post.user_id}`} className="font-semibold hover:underline">
              {post.profiles.display_name}
            </Link>{" "}
            {post.caption}
          </p>
        </div>
      )}
    </Card>
  );
}
