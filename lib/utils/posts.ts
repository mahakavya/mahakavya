import { createClient } from "@/lib/supabase/server";

export async function getFollowingPosts(userId: string) {
  const supabase = await createClient();
  
  const { data: followedUsers } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const followedIds = followedUsers?.map(f => f.following_id) || [];
  followedIds.push(userId); // Include own posts

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      likes(count),
      comments(count)
    `)
    .in("user_id", followedIds)
    .order("created_at", { ascending: false });

  return posts || [];
}

export async function getUserPosts(userId: string) {
  const supabase = await createClient();
  
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:user_id(username, display_name, avatar_url),
      likes(count),
      comments(count)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return posts || [];
}

export async function isPostLiked(postId: string, userId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .single();

  return !!data;
}
