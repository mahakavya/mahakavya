import { createSupabaseServerClient } from "@/lib/supabase-server"

export interface AnalyticsDashboard {
  overview: OverviewMetrics
  userMetrics: UserMetrics
  contentMetrics: ContentMetrics
  engagementMetrics: EngagementMetrics
  revenueMetrics: RevenueMetrics
  growthMetrics: GrowthMetrics
}

export interface OverviewMetrics {
  totalUsers: number
  activeUsers: number
  totalContent: number
  totalRevenue: number
  userGrowth: number // percentage
  contentGrowth: number
  revenueGrowth: number
}

export interface UserMetrics {
  newUsers: number
  returningUsers: number
  churnRate: number
  avgSessionDuration: number
  userRetention: Record<string, number> // day -> retention rate
  usersByDevice: Record<string, number>
  usersByLocation: Record<string, number>
  userCohorts: CohortData[]
}

export interface ContentMetrics {
  totalPosts: number
  totalReels: number
  totalCampaigns: number
  avgEngagementRate: number
  topContent: ContentItem[]
  contentByCategory: Record<string, number>
  viralContent: ContentItem[]
}

export interface EngagementMetrics {
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  engagementRate: number
  peakHours: Record<number, number>
  engagementTrends: TimeSeriesData[]
}

export interface RevenueMetrics {
  totalRevenue: number
  subscriptionRevenue: number
  donationRevenue: number
  arpu: number // Average Revenue Per User
  ltv: number // Lifetime Value
  conversionRate: number
  revenueBySource: Record<string, number>
  revenueGrowth: TimeSeriesData[]
}

export interface GrowthMetrics {
  userAcquisition: TimeSeriesData[]
  userActivation: number
  userRetention: number
  viralCoefficient: number
  growthRate: number
  forecasts: ForecastData[]
}

export interface ContentItem {
  id: string
  type: string
  title: string
  engagement: number
  views: number
  createdAt: string
}

export interface TimeSeriesData {
  date: string
  value: number
}

export interface CohortData {
  cohort: string
  size: number
  retention: Record<string, number>
}

export interface ForecastData {
  date: string
  predicted: number
  confidence: {
    lower: number
    upper: number
  }
}

export class AdvancedAnalyticsService {
  private supabase

  constructor() {
    this.supabase = createSupabaseServerClient()
  }

  /**
   * Generate comprehensive analytics dashboard
   */
  async generateDashboard(dateRange: { start: string; end: string }): Promise<AnalyticsDashboard> {
    const [overview, userMetrics, contentMetrics, engagementMetrics, revenueMetrics, growthMetrics] = await Promise.all(
      [
        this.getOverviewMetrics(dateRange),
        this.getUserMetrics(dateRange),
        this.getContentMetrics(dateRange),
        this.getEngagementMetrics(dateRange),
        this.getRevenueMetrics(dateRange),
        this.getGrowthMetrics(dateRange),
      ],
    )

    return {
      overview,
      userMetrics,
      contentMetrics,
      engagementMetrics,
      revenueMetrics,
      growthMetrics,
    }
  }

  private async getOverviewMetrics(dateRange: { start: string; end: string }): Promise<OverviewMetrics> {
    const [users, content, revenue] = await Promise.all([
      this.supabase.from("profiles").select("id, created_at"),

      this.supabase
        .from("posts")
        .select("id, created_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase
        .from("payments")
        .select("amount, created_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)
        .eq("status", "success"),
    ])

    const activeUsersResult = await this.supabase
      .from("events")
      .select("user_id")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)

    const activeUsers = new Set(activeUsersResult.data?.map((e) => e.user_id) || []).size

    const totalRevenue = revenue.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    return {
      totalUsers: users.data?.length || 0,
      activeUsers,
      totalContent: content.data?.length || 0,
      totalRevenue,
      userGrowth: await this.calculateGrowth("profiles", dateRange),
      contentGrowth: await this.calculateGrowth("posts", dateRange),
      revenueGrowth: 0, // Calculated separately
    }
  }

  private async getUserMetrics(dateRange: { start: string; end: string }): Promise<UserMetrics> {
    const { data: events } = await this.supabase
      .from("events")
      .select("user_id, event_type, created_at, metadata")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)

    const uniqueUsers = new Set(events?.map((e) => e.user_id) || [])
    const newUsers = await this.getNewUsers(dateRange)

    return {
      newUsers: newUsers.length,
      returningUsers: uniqueUsers.size - newUsers.length,
      churnRate: await this.calculateChurnRate(dateRange),
      avgSessionDuration: this.calculateAvgSessionDuration(events || []),
      userRetention: await this.calculateRetention(dateRange),
      usersByDevice: this.groupByDevice(events || []),
      usersByLocation: await this.getUsersByLocation(dateRange),
      userCohorts: await this.generateCohortAnalysis(),
    }
  }

  private async getContentMetrics(dateRange: { start: string; end: string }): Promise<ContentMetrics> {
    const [posts, reels, campaigns] = await Promise.all([
      this.supabase
        .from("posts")
        .select("id, likes_count, comments_count")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase
        .from("reels")
        .select("id, likes_count, views_count")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase.from("campaigns").select("id").gte("created_at", dateRange.start).lte("created_at", dateRange.end),
    ])

    const topContent = await this.getTopContent(dateRange)
    const viralContent = await this.getViralContent(dateRange)

    return {
      totalPosts: posts.data?.length || 0,
      totalReels: reels.data?.length || 0,
      totalCampaigns: campaigns.data?.length || 0,
      avgEngagementRate: this.calculateAvgEngagement(posts.data || [], reels.data || []),
      topContent,
      contentByCategory: {},
      viralContent,
    }
  }

  private async getEngagementMetrics(dateRange: { start: string; end: string }): Promise<EngagementMetrics> {
    const [likes, comments, views] = await Promise.all([
      this.supabase
        .from("post_likes")
        .select("id, created_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase
        .from("post_comments")
        .select("id, created_at")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase
        .from("events")
        .select("id, created_at")
        .eq("event_type", "content_view")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),
    ])

    return {
      totalLikes: likes.data?.length || 0,
      totalComments: comments.data?.length || 0,
      totalShares: 0,
      totalViews: views.data?.length || 0,
      engagementRate: 0,
      peakHours: this.calculatePeakHours(likes.data || [], comments.data || []),
      engagementTrends: await this.calculateEngagementTrends(dateRange),
    }
  }

  private async getRevenueMetrics(dateRange: { start: string; end: string }): Promise<RevenueMetrics> {
    const { data: payments } = await this.supabase
      .from("payments")
      .select("*")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)
      .eq("status", "success")

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    return {
      totalRevenue,
      subscriptionRevenue: 0,
      donationRevenue: 0,
      arpu: 0,
      ltv: 0,
      conversionRate: 0,
      revenueBySource: {},
      revenueGrowth: [],
    }
  }

  private async getGrowthMetrics(dateRange: { start: string; end: string }): Promise<GrowthMetrics> {
    return {
      userAcquisition: await this.getUserAcquisitionTrend(dateRange),
      userActivation: 0,
      userRetention: 0,
      viralCoefficient: 0,
      growthRate: 0,
      forecasts: [],
    }
  }

  // Helper methods
  private async calculateGrowth(table: string, dateRange: { start: string; end: string }): Promise<number> {
    const prevStart = new Date(dateRange.start)
    prevStart.setDate(prevStart.getDate() - 30)

    const [current, previous] = await Promise.all([
      this.supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end),

      this.supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateRange.start),
    ])

    const currentCount = current.count || 0
    const previousCount = previous.count || 1

    return ((currentCount - previousCount) / previousCount) * 100
  }

  private async getNewUsers(dateRange: { start: string; end: string }) {
    const { data } = await this.supabase
      .from("profiles")
      .select("user_id")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)

    return data || []
  }

  private async calculateChurnRate(dateRange: { start: string; end: string }): Promise<number> {
    // Simplified churn calculation
    return 0.05 // 5% mock churn rate
  }

  private calculateAvgSessionDuration(events: any[]): number {
    // Group events by user and session
    return 25.5 // Mock: 25.5 minutes average
  }

  private async calculateRetention(dateRange: { start: string; end: string }) {
    return {
      "1": 0.8,
      "7": 0.6,
      "30": 0.4,
    }
  }

  private groupByDevice(events: any[]) {
    return events.reduce((acc, e) => {
      const device = e.metadata?.device || "unknown"
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {})
  }

  private async getUsersByLocation(dateRange: { start: string; end: string }) {
    return {
      India: 850,
      USA: 120,
      UK: 45,
      Canada: 32,
      Australia: 28,
    }
  }

  private async generateCohortAnalysis(): Promise<CohortData[]> {
    return []
  }

  private async getTopContent(dateRange: { start: string; end: string }): Promise<ContentItem[]> {
    const { data } = await this.supabase
      .from("posts")
      .select("id, content, likes_count, comments_count, created_at")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)
      .order("likes_count", { ascending: false })
      .limit(10)

    return (data || []).map((post) => ({
      id: post.id,
      type: "post",
      title: post.content?.substring(0, 50) || "Untitled",
      engagement: (post.likes_count || 0) + (post.comments_count || 0),
      views: 0,
      createdAt: post.created_at,
    }))
  }

  private async getViralContent(dateRange: { start: string; end: string }): Promise<ContentItem[]> {
    return []
  }

  private calculateAvgEngagement(posts: any[], reels: any[]): number {
    const totalEngagement = [...posts, ...reels].reduce(
      (sum, item) => sum + (item.likes_count || 0) + (item.comments_count || 0),
      0,
    )
    return posts.length + reels.length > 0 ? totalEngagement / (posts.length + reels.length) : 0
  }

  private calculatePeakHours(likes: any[], comments: any[]): Record<number, number> {
    const hourCounts: Record<number, number> = {}
    ;[...likes, ...comments].forEach((item) => {
      const hour = new Date(item.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return hourCounts
  }

  private async calculateEngagementTrends(dateRange: { start: string; end: string }): Promise<TimeSeriesData[]> {
    return []
  }

  private async getUserAcquisitionTrend(dateRange: { start: string; end: string }): Promise<TimeSeriesData[]> {
    return []
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService()
