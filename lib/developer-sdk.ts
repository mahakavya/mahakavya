/**
 * Mahakavya Developer SDK
 * Official SDK for integrating with the Mahakavya platform
 *
 * @example
 * ```typescript
 * import { MahakavyaSDK } from '@mahakavya/sdk'
 *
 * const sdk = new MahakavyaSDK({
 *   apiKey: 'your-api-key',
 *   environment: 'production'
 * })
 *
 * const posts = await sdk.posts.list({ limit: 10 })
 * ```
 */

export interface SDKConfig {
  apiKey: string
  environment?: "production" | "staging" | "development"
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export interface Post {
  id: string
  content: string
  authorId: string
  media?: string[]
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  verified: boolean
  createdAt: string
}

export interface Campaign {
  id: string
  title: string
  description: string
  goalAmount: number
  raisedAmount: number
  status: "active" | "completed" | "cancelled"
  createdBy: string
  createdAt: string
  endsAt: string
}

export class MahakavyaSDK {
  private config: Required<SDKConfig>
  private baseUrl: string

  constructor(config: SDKConfig) {
    this.config = {
      apiKey: config.apiKey,
      environment: config.environment || "production",
      baseUrl: config.baseUrl || this.getDefaultBaseUrl(config.environment || "production"),
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
    }
    this.baseUrl = this.config.baseUrl
  }

  private getDefaultBaseUrl(environment: string): string {
    switch (environment) {
      case "production":
        return "https://api.mahakavya.com"
      case "staging":
        return "https://staging-api.mahakavya.com"
      case "development":
        return "http://localhost:3000"
      default:
        return "https://api.mahakavya.com"
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      "X-SDK-Version": "1.0.0",
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || "API_ERROR",
            message: data.message || "An error occurred",
            details: data.details,
          },
        }
      }

      return {
        success: true,
        data: data.data || data,
        meta: data.meta,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: (error as Error).message,
        },
      }
    }
  }

  // Posts API
  posts = {
    list: async (params?: { limit?: number; offset?: number }): Promise<APIResponse<Post[]>> => {
      const query = new URLSearchParams(params as any).toString()
      return this.request<Post[]>(`/api/v1/posts?${query}`)
    },

    get: async (id: string): Promise<APIResponse<Post>> => {
      return this.request<Post>(`/api/v1/posts/${id}`)
    },

    create: async (data: Partial<Post>): Promise<APIResponse<Post>> => {
      return this.request<Post>("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    update: async (id: string, data: Partial<Post>): Promise<APIResponse<Post>> => {
      return this.request<Post>(`/api/v1/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
    },

    delete: async (id: string): Promise<APIResponse<void>> => {
      return this.request<void>(`/api/v1/posts/${id}`, { method: "DELETE" })
    },

    like: async (id: string): Promise<APIResponse<void>> => {
      return this.request<void>(`/api/v1/posts/${id}/like`, { method: "POST" })
    },

    unlike: async (id: string): Promise<APIResponse<void>> => {
      return this.request<void>(`/api/v1/posts/${id}/unlike`, { method: "POST" })
    },
  }

  // Users API
  users = {
    get: async (id: string): Promise<APIResponse<User>> => {
      return this.request<User>(`/api/v1/users/${id}`)
    },

    list: async (params?: { limit?: number; offset?: number }): Promise<APIResponse<User[]>> => {
      const query = new URLSearchParams(params as any).toString()
      return this.request<User[]>(`/api/v1/users?${query}`)
    },

    search: async (query: string): Promise<APIResponse<User[]>> => {
      return this.request<User[]>(`/api/v1/users/search?q=${encodeURIComponent(query)}`)
    },
  }

  // Campaigns API
  campaigns = {
    list: async (params?: { limit?: number; offset?: number }): Promise<APIResponse<Campaign[]>> => {
      const query = new URLSearchParams(params as any).toString()
      return this.request<Campaign[]>(`/api/v1/campaigns?${query}`)
    },

    get: async (id: string): Promise<APIResponse<Campaign>> => {
      return this.request<Campaign>(`/api/v1/campaigns/${id}`)
    },

    create: async (data: Partial<Campaign>): Promise<APIResponse<Campaign>> => {
      return this.request<Campaign>("/api/v1/campaigns", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },

    donate: async (id: string, amount: number): Promise<APIResponse<any>> => {
      return this.request<any>(`/api/v1/campaigns/${id}/donate`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      })
    },
  }

  // Webhooks
  webhooks = {
    verify: (payload: string, signature: string, secret: string): boolean => {
      const crypto = require("crypto")
      const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex")
      return signature === expectedSignature
    },
  }

  // Analytics
  analytics = {
    track: async (event: string, properties: Record<string, any>): Promise<APIResponse<void>> => {
      return this.request<void>("/api/v1/analytics/track", {
        method: "POST",
        body: JSON.stringify({ event, properties }),
      })
    },
  }
}

// Export types for consumers
export type { Post, User, Campaign }
