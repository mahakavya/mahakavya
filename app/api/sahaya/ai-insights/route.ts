import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()
    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check premium access
    const { data: access } = await supabase
      .from("feature_access")
      .select("can_emotional")
      .eq("user_id", session.user.id)
      .single()

    if (!access?.can_emotional) {
      return NextResponse.json({ error: "Premium access required" }, { status: 403 })
    }

    // Generate AI insights based on user's session data
    const { data: userSessions } = await supabase
      .from("sessions")
      .select(`
        id,
        status,
        created_at,
        feedback_rating,
        feedback_text
      `)
      .or(`seeker_id.eq.${session.user.id},listener_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false })
      .limit(50)

    // Calculate sentiment analysis
    const completedSessions = userSessions?.filter((s) => s.status === "completed") || []
    const averageRating =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.feedback_rating || 0), 0) / completedSessions.length
        : 0

    // Analyze feedback text for mood (simplified AI simulation)
    const feedbackTexts = completedSessions.filter((s) => s.feedback_text).map((s) => s.feedback_text)

    const positiveWords = ["good", "great", "helpful", "amazing", "wonderful", "excellent"]
    const negativeWords = ["bad", "terrible", "awful", "horrible", "disappointing", "useless"]

    let positiveCount = 0
    let negativeCount = 0

    feedbackTexts.forEach((text) => {
      const lowerText = text.toLowerCase()
      positiveWords.forEach((word) => {
        if (lowerText.includes(word)) positiveCount++
      })
      negativeWords.forEach((word) => {
        if (lowerText.includes(word)) negativeCount++
      })
    })

    const overallMood =
      positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral"

    // Calculate stress level based on session frequency and ratings
    const recentSessions =
      userSessions?.filter((s) => {
        const sessionDate = new Date(s.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return sessionDate > weekAgo
      }) || []

    const stressLevel = Math.min(100, Math.max(0, recentSessions.length * 10 + (averageRating < 3 ? 30 : 0)))

    // Support effectiveness based on completion rate and ratings
    const completionRate = userSessions?.length > 0 ? (completedSessions.length / userSessions.length) * 100 : 0
    const supportEffectiveness = Math.min(100, (completionRate + averageRating * 20) / 2)

    // Generate AI recommendations
    const recommendations = []
    if (averageRating < 3) {
      recommendations.push("Consider trying different listeners to find better matches for your needs")
    }
    if (stressLevel > 70) {
      recommendations.push("Your stress levels appear elevated. Consider scheduling more frequent sessions")
    }
    if (completionRate < 80) {
      recommendations.push("Try setting clearer expectations at the start of sessions to improve outcomes")
    }
    if (recommendations.length === 0) {
      recommendations.push("You're doing great! Continue with your current support routine")
    }

    // Get trending topics from recent sessions
    const { data: trendingData } = await supabase
      .from("sessions")
      .select("feedback_text")
      .not("feedback_text", "is", null)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    // Extract trending topics (simplified)
    const topics = ["Anxiety", "Relationships", "Work Stress", "Family Issues", "Self-Esteem"]
    const trendingTopics = topics.slice(0, 3)

    // Calculate success metrics
    const sessionCompletionRate = completionRate
    const satisfactionScore = averageRating
    const responseTime = 15 // Average response time in minutes

    // Simulate fetching AI insights
    const data = {
      listenerRecommendations: ["Active Listening", "Empathy", "Non-Judgmental"],
      sessionTopicSuggestions: ["Stress", "Anxiety", "Depression"],
    }

    const insights = {
      sentiment_analysis: {
        overall_mood: overallMood,
        stress_level: stressLevel,
        support_effectiveness: supportEffectiveness,
      },
      recommendations,
      trending_topics: trendingTopics,
      success_metrics: {
        session_completion_rate: sessionCompletionRate,
        satisfaction_score: satisfactionScore,
        response_time: responseTime,
      },
      listenerRecommendations: data.listenerRecommendations,
      sessionTopicSuggestions: data.sessionTopicSuggestions,
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("AI insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
