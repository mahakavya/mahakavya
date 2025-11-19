import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's messages count
    const { count: totalMessages } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", session.user.id)

    // Get active conversations count
    const { count: activeConversations } = await supabase
      .from("conversation_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)

    // Calculate average response time (mock calculation)
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("created_at, conversation_id")
      .eq("sender_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    let totalResponseTime = 0
    let responseCount = 0

    if (recentMessages && recentMessages.length > 1) {
      for (let i = 1; i < recentMessages.length; i++) {
        const currentTime = new Date(recentMessages[i - 1].created_at).getTime()
        const previousTime = new Date(recentMessages[i].created_at).getTime()
        const timeDiff = currentTime - previousTime

        // Only count reasonable response times (within 1 hour)
        if (timeDiff > 0 && timeDiff < 3600000) {
          totalResponseTime += timeDiff
          responseCount++
        }
      }
    }

    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0

    const formatResponseTime = (seconds: number) => {
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.round(seconds / 60)}m`
      return `${Math.round(seconds / 3600)}h`
    }

    // Calculate engagement score based on activity
    const engagementScore = Math.min(
      100,
      Math.round(
        (totalMessages || 0) * 0.3 + (activeConversations || 0) * 2 + (responseCount > 0 ? 30 : 0) + Math.random() * 20,
      ),
    )

    return NextResponse.json({
      totalMessages: totalMessages || 0,
      activeConversations: activeConversations || 0,
      responseTime: formatResponseTime(averageResponseTime),
      engagementScore,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
