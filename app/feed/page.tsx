"use client";

import { useEffect, useState } from "react";
import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/header";
import { FeedPost } from "@/components/feed-post";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Loader2 } from 'lucide-react';

export default function FeedPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          redirect("/auth/login");
          return;
        }

        setCurrentUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setUserProfile(profile);

        // Get feed posts (posts from users the current user follows + their own posts)
        const { data: followingData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = followingData?.map((f: any) => f.following_id) || [];
        const postsToFetch = [user.id, ...followingIds];

        const { data: postsData } = await supabase
          .from("posts")
          .select(
            `
            id,
            user_id,
            caption,
            image_url,
            created_at,
            profiles(username, display_name, avatar_url),
            likes(user_id),
            comments(id, content, user_id, profiles(username, display_name))
          `
          )
          .in("user_id", postsToFetch)
          .order("created_at", { ascending: false });

        setPosts(postsData || []);
      } catch (error) {
        console.error("Error loading feed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeed();
  }, []);

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: isLiked
                ? [...post.likes, { user_id: currentUser?.id }]
                : post.likes.filter((l: any) => l.user_id !== currentUser?.id),
            }
          : post
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      {userProfile && <Header userProfile={userProfile} />}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Feed</h1>
          <Link href="/create-post">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No posts yet. Follow some users or create your first post!
              </p>
              <Link href="/create-post">
                <Button>Create Your First Post</Button>
              </Link>
            </div>
          ) : (
            posts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                onLikeToggle={handleLikeToggle}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
