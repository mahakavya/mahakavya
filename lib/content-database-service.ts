import type { ContentItem } from "./ai-content-service"
import { createSupabaseServerClient } from "./supabase-server"

export interface DatabaseContentItem {
  id: string
  type: "post" | "reel" | "comment"
  content_id: string
  author_id: string
  content_text?: string
  media_urls?: string[]
  status: "pending" | "approved" | "rejected" | "flagged"
  risk_level: "low" | "medium" | "high" | "critical"
  ai_score: number
  blockchain_hash?: string
  created_at: string
  updated_at: string
  author_name?: string
  author_avatar?: string
  toxicity_score?: number
  sentiment_score?: number
  category?: string
  confidence?: number
  flags?: string[]
  recommendations?: string
  transaction_hash?: string
  verification_status?: string
  integrity_hash?: string
}

class ContentDatabaseService {
  async getContentItems(filters?: {
    status?: string
    riskLevel?: string
    type?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ items: ContentItem[]; total: number }> {
    try {
  const supabase = createSupabaseServerClient() as any
  let query = supabase.from("content_with_analysis").select("*", { count: "exact" }).order("created_at", { ascending: false })

      if (filters) {
        if (filters.status && filters.status !== "all") {
          query = query.eq("status", filters.status)
        }
        if (filters.riskLevel && filters.riskLevel !== "all") {
          query = query.eq("risk_level", filters.riskLevel)
        }
        if (filters.type && filters.type !== "all") {
          query = query.eq("type", filters.type)
        }
        if (filters.search) {
          query = query.or(`content_text.ilike.%${filters.search}%,author_name.ilike.%${filters.search}%`)
        }
        if (filters.limit) {
          query = query.limit(filters.limit)
        }
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
        }
      }

  const res: any = await query
  const data = res.data
  const error = res.error
  const count = res.count

      if (error) {
        console.error("Database query error:", error)
        throw error
      }

  const items: ContentItem[] = (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        contentId: item.content_id,
        authorId: item.author_id,
        contentText: item.content_text,
        mediaUrls: item.media_urls,
        status: item.status,
        riskLevel: item.risk_level,
        aiScore: item.ai_score,
        createdAt: item.created_at,
        author: {
          id: item.author_id,
          name: item.author_name || "Unknown User",
          avatarUrl: item.author_avatar || "/placeholder-u.png",
        },
      }))

      return { items, total: count || 0 }
    } catch (error) {
      console.error("Get content items error:", error)
      return { items: [], total: 0 }
    }
  }

  async getContentStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
    flagged: number
    riskDistribution: Record<string, number>
    processingTime: number
  }> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.rpc("get_content_stats")
  const data = res.data
  const error = res.error

      if (error) {
        console.error("Stats query error:", error)
        throw error
      }

      return (
        data || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          flagged: 0,
          riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
          processingTime: 0,
        }
      )
    } catch (error) {
      console.error("Get stats error:", error)
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        flagged: 0,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        processingTime: 0,
      }
    }
  }

  async moderateContent(
    contentId: string,
    moderatorId: string,
    action: "approve" | "reject" | "flag",
    reason?: string,
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase.rpc("moderate_content", {
        p_content_id: contentId,
        p_moderator_id: moderatorId,
        p_action: action,
        p_reason: reason || null,
        p_automated: false,
      })

      const data = res.data
      const error = res.error
      if (error) {
        console.error("Moderation error:", error)
        throw error
      }

      return data === true
    } catch (error) {
      console.error("Moderate content error:", error)
      return false
    }
  }

  async bulkModerate(
    contentIds: string[],
    moderatorId: string,
    action: "approve" | "reject" | "flag",
    reason?: string,
  ): Promise<{
    success: number
    failed: number
    total: number
    errors: string[]
  }> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase.rpc("bulk_moderate_content", {
        p_content_ids: contentIds,
        p_moderator_id: moderatorId,
        p_action: action,
        p_reason: reason || null,
        p_automated: true,
      })

      const data = res.data
      const error = res.error
      if (error) {
        console.error("Bulk moderation error:", error)
        throw error
      }

      return {
        success: data?.success || 0,
        failed: data?.failed || 0,
        total: data?.total || 0,
        errors: data?.failed > 0 ? [`${data.failed} items failed to process`] : [],
      }
    } catch (error) {
      console.error("Bulk moderate error:", error)
      return {
        success: 0,
        failed: contentIds.length,
        total: contentIds.length,
        errors: ["Bulk moderation failed"],
      }
    }
  }

  async getContentById(contentId: string): Promise<ContentItem | null> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.from("content_with_analysis").select("*").eq("id", contentId).single()
  const data = res.data
  const error = res.error

      if (error) {
        console.error("Get content by ID error:", error)
        return null
      }

      if (!data) return null

  return {
        id: data.id,
        type: data.type,
        contentId: data.content_id,
        authorId: data.author_id,
        contentText: data.content_text,
        mediaUrls: data.media_urls,
        status: data.status,
        riskLevel: data.risk_level,
        aiScore: data.ai_score,
        createdAt: data.created_at,
        author: {
          id: data.author_id,
          name: data.author_name || "Unknown User",
          avatarUrl: data.author_avatar || "/placeholder-u.png",
        },
      }
    } catch (error) {
      console.error("Get content by ID error:", error)
      return null
    }
  }

  async createContentItem(item: {
    type: "post" | "reel" | "comment"
    contentId: string
    authorId: string
    contentText?: string
    mediaUrls?: string[]
    status?: "pending" | "approved" | "rejected" | "flagged"
    riskLevel?: "low" | "medium" | "high" | "critical"
    aiScore?: number
  }): Promise<string | null> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase
        .from("content_items")
        .insert({
          type: item.type,
          content_id: item.contentId,
          author_id: item.authorId,
          content_text: item.contentText,
          media_urls: item.mediaUrls,
          status: item.status || "pending",
          risk_level: item.riskLevel || "low",
          ai_score: item.aiScore || 0,
        })
        .select("id")
        .single()

      const data = res.data
      const error = res.error

      if (error) {
        console.error("Create content item error:", error)
        throw error
      }

      return data?.id || null
    } catch (error) {
      console.error("Create content item error:", error)
      return null
    }
  }

  async updateContentItem(
    contentId: string,
    updates: {
      status?: "pending" | "approved" | "rejected" | "flagged"
      riskLevel?: "low" | "medium" | "high" | "critical"
      aiScore?: number
      blockchainHash?: string
    },
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase
        .from("content_items")
        .update({
          status: updates.status,
          risk_level: updates.riskLevel,
          ai_score: updates.aiScore,
          blockchain_hash: updates.blockchainHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contentId)

      const error = res.error

      if (error) {
        console.error("Update content item error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Update content item error:", error)
      return false
    }
  }

  async deleteContentItem(contentId: string): Promise<boolean> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.from("content_items").delete().eq("id", contentId)
  const error = res.error

      if (error) {
        console.error("Delete content item error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Delete content item error:", error)
      return false
    }
  }

  async saveAIAnalysis(
    contentItemId: string,
    analysis: {
      toxicityScore: number
      sentimentScore: number
      category: string
      confidence: number
      flags: string[]
      recommendations: string
    },
  ): Promise<boolean> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.from("ai_analysis").insert({
        content_item_id: contentItemId,
        toxicity_score: analysis.toxicityScore,
        sentiment_score: analysis.sentimentScore,
        category: analysis.category,
        confidence: analysis.confidence,
        flags: analysis.flags,
        recommendations: analysis.recommendations,
      })

  const error = res.error

      if (error) {
        console.error("Save AI analysis error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Save AI analysis error:", error)
      return false
    }
  }

  async saveBlockchainRecord(
    contentItemId: string,
    record: {
      transactionHash: string
      blockNumber: number
      verificationStatus: string
      integrityHash: string
    },
  ): Promise<boolean> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.from("blockchain_records").insert({
        content_item_id: contentItemId,
        transaction_hash: record.transactionHash,
        block_number: record.blockNumber,
        verification_status: record.verificationStatus,
        integrity_hash: record.integrityHash,
      })

  const error = res.error

      if (error) {
        console.error("Save blockchain record error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Save blockchain record error:", error)
      return false
    }
  }

  async getAutomationJobs(): Promise<any[]> {
    try {
  const supabase = createSupabaseServerClient() as any
  const res: any = await supabase.from("automation_jobs").select("*").order("created_at", { ascending: false })
  const data = res.data
  const error = res.error

      if (error) {
        console.error("Get automation jobs error:", error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error("Get automation jobs error:", error)
      return []
    }
  }

  async createAutomationJob(job: {
    jobType: string
    parameters: any
    status?: string
  }): Promise<string | null> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase
        .from("automation_jobs")
        .insert({
          job_type: job.jobType,
          parameters: job.parameters,
          status: job.status || "queued",
        })
        .select("id")
        .single()

      const data = res.data
      const error = res.error

      if (error) {
        console.error("Create automation job error:", error)
        throw error
      }

      return data?.id || null
    } catch (error) {
      console.error("Create automation job error:", error)
      return null
    }
  }

  async updateAutomationJob(
    jobId: string,
    updates: {
      status?: string
      progress?: number
      results?: any
      startedAt?: string
      completedAt?: string
    },
  ): Promise<boolean> {
    try {
      const supabase = createSupabaseServerClient() as any
      const res: any = await supabase
        .from("automation_jobs")
        .update({
          status: updates.status,
          progress: updates.progress,
          results: updates.results,
          started_at: updates.startedAt,
          completed_at: updates.completedAt,
        })
        .eq("id", jobId)

      const error = res.error

      if (error) {
        console.error("Update automation job error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Update automation job error:", error)
      return false
    }
  }
}

export const contentDatabaseService = new ContentDatabaseService()
