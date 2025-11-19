import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get total posts count
    const { count: totalPosts } = await supabase.from("posts").select("*", { count: "exact", head: true })

    // Get active users (posted in last 24 hours)
    const { data: activeUsers } = await supabase
      .from("posts")
      .select("author_id")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const uniqueActiveUsers = new Set(activeUsers?.map((p) => p.author_id)).size

    // Get trending posts (high engagement in last 24 hours)
    const { count: trendingPosts } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .gte("likes_count", 5)

    // Get AI enhanced posts
    const { count: aiEnhanced } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("ai_score", 0.7)

    // Get blockchain verified posts
    const { count: blockchainVerified } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("blockchain_verified", true)

    // Get RPA optimized posts
    const { count: rpaOptimized } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("rpa_optimized", true)

    const stats = {
      total_posts: totalPosts || 0,
      active_users: uniqueActiveUsers || 0,
      trending_posts: trendingPosts || 0,
      ai_enhanced: aiEnhanced || 0,
      blockchain_verified: blockchainVerified || 0,
      rpa_optimized: rpaOptimized || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in feed stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
