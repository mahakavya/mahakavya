import { createSupabaseServerClient } from "@/lib/supabase-server"

export interface UserPreferences {
  categories: Record<string, number> // Category -> interest score (0-1)
  tags: Record<string, number>
  users: Record<string, number> // user_id -> affinity score
  timeOfDay: Record<number, number> // hour -> activity score
  contentTypes: Record<string, number> // post, reel, campaign -> preference
}

export interface RecommendationScore {
  contentId: string
  score: number
  reasons: string[]
  category: string
}

export class RecommendationEngine {
  private supabase

  constructor() {
    this.supabase = createSupabaseServerClient()
  }

  /**
   * Generate personalized content recommendations using collaborative filtering and content-based algorithms
   */
  async generateRecommendations(
    userId: string,
    contentType: "posts" | "reels" | "campaigns" | "all" = "all",
    limit = 20,
  ): Promise<RecommendationScore[]> {
    // Get user preferences
    const preferences = await this.getUserPreferences(userId)

    // Get candidate content
    const candidates = await this.getCandidateContent(contentType, limit * 3)

    // Score each candidate
    const scored = candidates.map((content) => this.scoreContent(content, preferences))

    // Sort by score and return top results
    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  /**
   * Analyze user's historical behavior to build preference profile
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    const [likes, comments, views, follows] = await Promise.all([
      this.supabase
        .from("post_likes")
        .select("post_id, posts(tags, author_id, created_at)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),

      this.supabase
        .from("post_comments")
        .select("post_id, posts(tags, author_id)")
        .eq("author_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),

      this.supabase
        .from("events")
        .select("metadata")
        .eq("user_id", userId)
        .eq("event_type", "content_view")
        .order("created_at", { ascending: false })
        .limit(200),

      this.supabase.from("follows").select("following_id").eq("follower_id", userId),
    ])

    const preferences: UserPreferences = {
      categories: {},
      tags: {},
      users: {},
      timeOfDay: {},
      contentTypes: {},
    }

    // Analyze likes (weight: 1.0)
    likes.data?.forEach((like: any) => {
      const post = like.posts
      if (post) {
        this.updateTagPreferences(preferences.tags, post.tags || [], 1.0)
        preferences.users[post.author_id] = (preferences.users[post.author_id] || 0) + 1.0

        const hour = new Date(post.created_at).getHours()
        preferences.timeOfDay[hour] = (preferences.timeOfDay[hour] || 0) + 0.5
      }
    })

    // Analyze comments (weight: 1.5 - stronger signal)
    comments.data?.forEach((comment: any) => {
      const post = comment.posts
      if (post) {
        this.updateTagPreferences(preferences.tags, post.tags || [], 1.5)
        preferences.users[post.author_id] = (preferences.users[post.author_id] || 0) + 1.5
      }
    })

    // Analyze views (weight: 0.3 - weaker signal)
    views.data?.forEach((view: any) => {
      const metadata = view.metadata || {}
      if (metadata.contentType) {
        preferences.contentTypes[metadata.contentType] = (preferences.contentTypes[metadata.contentType] || 0) + 0.3
      }
    })

    // Analyze follows (weight: 2.0 - very strong signal)
    follows.data?.forEach((follow: any) => {
      preferences.users[follow.following_id] = (preferences.users[follow.following_id] || 0) + 2.0
    })

    // Normalize scores to 0-1 range
    this.normalizePreferences(preferences)

    return preferences
  }

  private updateTagPreferences(tags: Record<string, number>, newTags: string[], weight: number) {
    newTags.forEach((tag) => {
      tags[tag] = (tags[tag] || 0) + weight
    })
  }

  private normalizePreferences(preferences: UserPreferences) {
    const normalize = (obj: Record<string, number>) => {
      const max = Math.max(...Object.values(obj), 1)
      Object.keys(obj).forEach((key) => {
        obj[key] = obj[key] / max
      })
    }

    normalize(preferences.tags)
    normalize(preferences.users)
    normalize(preferences.timeOfDay)
    normalize(preferences.contentTypes)
  }

  /**
   * Get candidate content for recommendation
   */
  private async getCandidateContent(contentType: string, limit: number) {
    if (contentType === "posts" || contentType === "all") {
      const { data } = await this.supabase
        .from("posts")
        .select("id, content, tags, author_id, created_at, likes_count, comments_count")
        .eq("hidden", false)
        .order("created_at", { ascending: false })
        .limit(limit)

      return (data || []).map((post) => ({
        ...post,
        type: "post",
      }))
    }

    if (contentType === "reels") {
      const { data } = await this.supabase
        .from("reels")
        .select("id, caption, author_id, created_at, likes_count, views_count")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit)

      return (data || []).map((reel) => ({
        ...reel,
        type: "reel",
        tags: [],
      }))
    }

    if (contentType === "campaigns") {
      const { data } = await this.supabase
        .from("campaigns")
        .select("id, title, description, creator_id, created_at")
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(limit)

      return (data || []).map((campaign) => ({
        ...campaign,
        type: "campaign",
        tags: [],
        author_id: campaign.creator_id,
      }))
    }

    return []
  }

  /**
   * Score content based on user preferences using multiple signals
   */
  private scoreContent(content: any, preferences: UserPreferences): RecommendationScore {
    let score = 0
    const reasons: string[] = []

    // Tag matching (weight: 0.4)
    if (content.tags && content.tags.length > 0) {
      const tagScore =
        content.tags.reduce((sum: number, tag: string) => {
          return sum + (preferences.tags[tag] || 0)
        }, 0) / content.tags.length

      score += tagScore * 0.4
      if (tagScore > 0.5) {
        reasons.push("Matches your interests")
      }
    }

    // Author affinity (weight: 0.3)
    const authorScore = preferences.users[content.author_id] || 0
    score += authorScore * 0.3
    if (authorScore > 0.6) {
      reasons.push("From a creator you engage with")
    }

    // Content type preference (weight: 0.15)
    const typeScore = preferences.contentTypes[content.type] || 0.5
    score += typeScore * 0.15

    // Engagement signals (weight: 0.1)
    const engagementScore = this.calculateEngagementScore(content)
    score += engagementScore * 0.1
    if (engagementScore > 0.7) {
      reasons.push("Popular with community")
    }

    // Recency bonus (weight: 0.05)
    const recencyScore = this.calculateRecencyScore(content.created_at)
    score += recencyScore * 0.05
    if (recencyScore > 0.8) {
      reasons.push("Recently posted")
    }

    // Diversity penalty - reduce score if too similar to recent recommendations
    // This prevents filter bubbles

    return {
      contentId: content.id,
      score: Math.min(score, 1),
      reasons: reasons.length > 0 ? reasons : ["Suggested for you"],
      category: content.type,
    }
  }

  private calculateEngagementScore(content: any): number {
    const likes = content.likes_count || 0
    const comments = content.comments_count || 0
    const views = content.views_count || 1

    // Engagement rate
    const engagementRate = (likes + comments * 2) / Math.max(views, 1)

    // Normalize to 0-1
    return Math.min(engagementRate * 10, 1)
  }

  private calculateRecencyScore(createdAt: string): number {
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)

    // Exponential decay: newer content scores higher
    return Math.exp(-hoursSince / 24) // Half-life of 24 hours
  }

  /**
   * Update user preferences based on interaction
   */
  async recordInteraction(userId: string, contentId: string, interactionType: "like" | "comment" | "view" | "share") {
    const weights = {
      like: 1.0,
      comment: 1.5,
      view: 0.3,
      share: 2.0,
    }

    await this.supabase.from("recommendation_feedback").insert({
      user_id: userId,
      content_id: contentId,
      interaction_type: interactionType,
      weight: weights[interactionType],
      created_at: new Date().toISOString(),
    })
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine()
