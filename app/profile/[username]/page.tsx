"use client";

import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Loader2, Edit2, UserPlus, UserCheck } from 'lucide-react';
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ display_name: "", bio: "", website: "" });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const { data: currProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setCurrentUserProfile(currProfile);
        }

        // Load profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", username)
          .single();

        if (profileData) {
          setProfile(profileData);
          setEditData({
            display_name: profileData.display_name || "",
            bio: profileData.bio || "",
            website: profileData.website || "",
          });

          // Load posts
          const { data: postsData } = await supabase
            .from("posts")
            .select("*")
            .eq("user_id", profileData.id)
            .order("created_at", { ascending: false });

          setPosts(postsData || []);

          // Check if following
          if (user && user.id !== profileData.id) {
            const { data: followData } = await supabase
              .from("follows")
              .select("*")
              .eq("follower_id", user.id)
              .eq("following_id", profileData.id)
              .single();

            setIsFollowing(!!followData);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id);
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: profile.id,
        });
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser || !profile || currentUser.id !== profile.id) return;

    try {
      await supabase
        .from("profiles")
        .update(editData)
        .eq("id", currentUser.id);

      setProfile({ ...profile, ...editData });
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-svh">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const followerCount = 0; // Would need a separate query for this

  return (
    <div className="min-h-svh bg-background">
      {currentUserProfile && <Header userProfile={currentUserProfile} />}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex gap-8 mb-12">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-4xl font-bold flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url || "/placeholder.svg"}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover"
              />
            ) : (
              profile.display_name?.charAt(0) || "U"
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>

              {isOwnProfile ? (
                <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1">
                          Display Name
                        </label>
                        <Input
                          value={editData.display_name}
                          onChange={(e) =>
                            setEditData({ ...editData, display_name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Bio</label>
                        <Textarea
                          value={editData.bio}
                          onChange={(e) =>
                            setEditData({ ...editData, bio: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1">Website</label>
                        <Input
                          value={editData.website}
                          onChange={(e) =>
                            setEditData({ ...editData, website: e.target.value })
                          }
                        />
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={handleFollowToggle}
                  className="gap-2"
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {profile.bio && <p className="text-muted-foreground mb-2">{profile.bio}</p>}
            {profile.website && (
              <Link href={profile.website} className="text-primary hover:underline text-sm">
                {profile.website}
              </Link>
            )}

            <div className="flex gap-8 mt-6">
              <div>
                <p className="font-bold text-lg">{posts.length}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="font-bold text-lg">{followerCount}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div>
          <h2 className="text-xl font-bold mb-6">Posts</h2>
          <div className="grid grid-cols-3 gap-4">
            {posts.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-muted rounded overflow-hidden cursor-pointer hover:opacity-75 transition"
                >
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt={post.caption || "Post"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
