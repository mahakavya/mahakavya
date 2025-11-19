"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  currentUserId: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  currentUserId,
  postCount,
  followerCount,
  followingCount,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isOwnProfile) {
      checkFollowStatus();
    }
  }, [profile.id, isOwnProfile]);

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", profile.id)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.id);
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: profile.id,
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <Image
          src={profile.avatar_url || "/placeholder.svg?height=120&width=120&query=avatar"}
          alt={profile.display_name}
          width={120}
          height={120}
          className="w-30 h-30 rounded-full object-cover"
        />

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-2">{profile.bio}</p>}
          {profile.website && (
            <p className="mt-1 text-primary hover:underline">
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                {profile.website}
              </a>
            </p>
          )}

          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{postCount}</p>
              <p className="text-sm text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followerCount}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{followingCount}</p>
              <p className="text-sm text-muted-foreground">Following</p>
            </div>
          </div>

          {!isOwnProfile && (
            <Button
              onClick={handleFollowToggle}
              disabled={loading}
              variant={isFollowing ? "outline" : "default"}
              className="mt-4"
            >
              {loading ? "..." : isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
