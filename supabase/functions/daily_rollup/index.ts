import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/io/mod.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]

    console.log(`Running daily rollup for ${yesterdayStr}`)

    // Calculate DAU (users who were active yesterday)
    const { count: dau } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", `${yesterdayStr}T00:00:00Z`)
      .lt("updated_at", `${today}T00:00:00Z`)

    // Calculate new signups
    const { count: newSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${yesterdayStr}T00:00:00Z`)
      .lt("created_at", `${today}T00:00:00Z`)

    // Calculate active premium subscriptions
    const { count: premiumActive } = await supabase
      .from("user_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE")

    // Calculate content metrics (assuming we have posts, reels, messages tables)
    const [postsResult, reelsResult, messagesResult] = await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${yesterdayStr}T00:00:00Z`)
        .lt("created_at", `${today}T00:00:00Z`),

      supabase
        .from("reels")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${yesterdayStr}T00:00:00Z`)
        .lt("created_at", `${today}T00:00:00Z`),

      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${yesterdayStr}T00:00:00Z`)
        .lt("created_at", `${today}T00:00:00Z`),
    ])

    // Upsert the daily usage record
    const { error } = await supabase.from("daily_usage").upsert(
      {
        usage_date: yesterdayStr,
        dau: dau || 0,
        new_signups: newSignups || 0,
        premium_active: premiumActive || 0,
        posts: postsResult.count || 0,
        reels: reelsResult.count || 0,
        messages: messagesResult.count || 0,
      },
      {
        onConflict: "usage_date",
      },
    )

    if (error) {
      throw error
    }

    console.log(`Daily rollup completed for ${yesterdayStr}:`, {
      dau: dau || 0,
      newSignups: newSignups || 0,
      premiumActive: premiumActive || 0,
      posts: postsResult.count || 0,
      reels: reelsResult.count || 0,
      messages: messagesResult.count || 0,
    })

    return new Response(
      JSON.stringify({
        success: true,
        date: yesterdayStr,
        metrics: {
          dau: dau || 0,
          newSignups: newSignups || 0,
          premiumActive: premiumActive || 0,
          posts: postsResult.count || 0,
          reels: reelsResult.count || 0,
          messages: messagesResult.count || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Daily rollup error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
