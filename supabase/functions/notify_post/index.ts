import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

    const { record } = await req.json()

    if (!record || !record.id) {
      throw new Error("Invalid post record")
    }

    // Get post details with author
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select(`
        *,
        author:user_profiles!posts_author_id_fkey(id, display_name, avatar_url)
      `)
      .eq("id", record.id)
      .single()

    if (postError) {
      throw postError
    }

    // For PUBLIC posts, we could notify followers
    // For now, we'll just create a simple notification entry
    if (post.visibility === "PUBLIC") {
      // Get followers of the post author
      const { data: followers, error: followersError } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("followee_id", post.author_id)

      if (followersError) {
        console.error("Error fetching followers:", followersError)
      } else if (followers && followers.length > 0) {
        // Create notifications for followers
        const notifications = followers.map((follow) => ({
          user_id: follow.follower_id,
          type: "post" as const,
          content: {
            post_id: post.id,
            author_id: post.author_id,
            author_name: post.author.display_name,
            body: post.body ? post.body.substring(0, 100) : "New post",
            has_media: post.media_urls && post.media_urls.length > 0,
          },
        }))

        const { error: notificationError } = await supabase.from("notifications").insert(notifications)

        if (notificationError) {
          console.error("Error creating notifications:", notificationError)
        } else {
          console.log(`Created ${notifications.length} notifications for new post`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Post notification processed",
        notifications_created: post.visibility === "PUBLIC" ? "followers" : "none",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Error in notify_post function:", error)

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
