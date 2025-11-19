import type { ContentItem } from "./ai-content-service"

class MockContentService {
  private generateMockContent(): ContentItem[] {
    const mockData: ContentItem[] = [
      {
        id: "1",
        type: "post",
        contentId: "post_001",
        authorId: "user_001",
        contentText: "Beautiful sunset at the beach today! #nature #photography #blessed",
        mediaUrls: ["/beach-sunset.png"],
        status: "approved",
        riskLevel: "low",
        aiScore: 0.15,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        author: {
          id: "user_001",
          name: "Priya Sharma",
          avatarUrl: "/placeholder-u.png",
        },
      },
      {
        id: "2",
        type: "reel",
        contentId: "reel_001",
        authorId: "user_002",
        contentText: "Check out my new dance routine! 💃 #dance #trending #viral",
        mediaUrls: ["/dance-routine-video.png", "/dance-thumbnail.png"],
        status: "pending",
        riskLevel: "medium",
        aiScore: 0.45,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        author: {
          id: "user_002",
          name: "Arjun Patel",
          avatarUrl: "/placeholder-u.png",
        },
      },
      {
        id: "3",
        type: "post",
        contentId: "post_002",
        authorId: "user_003",
        contentText: "URGENT!!! Make money fast with this cryptocurrency scheme! Click link below!!!",
        status: "flagged",
        riskLevel: "high",
        aiScore: 0.85,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        author: {
          id: "user_003",
          name: "Suspicious User",
          avatarUrl: "/placeholder-u.png",
        },
      },
      {
        id: "4",
        type: "reel",
        contentId: "reel_002",
        authorId: "user_004",
        contentText: "Promoting my new crypto investment opportunity! 🚀💰",
        mediaUrls: ["/cryptocurrency-promotion.png", "/crypto-thumbnail.png"],
        status: "rejected",
        riskLevel: "critical",
        aiScore: 0.92,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        author: {
          id: "user_004",
          name: "Crypto Scammer",
          avatarUrl: "/placeholder-u.png",
        },
      },
      {
        id: "5",
        type: "post",
        contentId: "post_003",
        authorId: "user_005",
        contentText: "Sharing some wisdom from ancient Sanskrit texts. Knowledge is the greatest wealth. 📚✨",
        status: "approved",
        riskLevel: "low",
        aiScore: 0.05,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        author: {
          id: "user_005",
          name: "Dr. Rajesh Kumar",
          avatarUrl: "/placeholder-u.png",
        },
      },
    ]

    return mockData
  }

  async getContentItems(filters?: {
    status?: string
    riskLevel?: string
    type?: string
    search?: string
  }): Promise<ContentItem[]> {
    let items = this.generateMockContent()

    if (filters) {
      if (filters.status) {
        items = items.filter((item) => item.status === filters.status)
      }
      if (filters.riskLevel) {
        items = items.filter((item) => item.riskLevel === filters.riskLevel)
      }
      if (filters.type) {
        items = items.filter((item) => item.type === filters.type)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        items = items.filter(
          (item) =>
            item.contentText?.toLowerCase().includes(searchLower) ||
            item.author?.name.toLowerCase().includes(searchLower),
        )
      }
    }

    return items
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
    const items = await this.getContentItems()

    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
      flagged: items.filter((i) => i.status === "flagged").length,
      riskDistribution: {
        low: items.filter((i) => i.riskLevel === "low").length,
        medium: items.filter((i) => i.riskLevel === "medium").length,
        high: items.filter((i) => i.riskLevel === "high").length,
        critical: items.filter((i) => i.riskLevel === "critical").length,
      },
      processingTime: 1.2, // Average processing time in seconds
    }
  }

  async moderateContent(contentId: string, action: "approve" | "reject" | "flag", reason?: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // In a real implementation, this would update the database
    console.log(`Content ${contentId} ${action}ed: ${reason || "No reason provided"}`)

    return true
  }

  async bulkModerate(
    contentIds: string[],
    action: "approve" | "reject" | "flag",
    reason?: string,
  ): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    // Simulate bulk processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const success = Math.floor(contentIds.length * 0.9)
    const failed = contentIds.length - success

    return {
      success,
      failed,
      errors: failed > 0 ? [`Failed to process ${failed} items`] : [],
    }
  }
}

export const mockContentService = new MockContentService()
