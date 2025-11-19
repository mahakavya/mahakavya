import { createClient } from "@supabase/supabase-js"

export interface Organization {
  id: string
  name: string
  slug: string
  tier: "starter" | "professional" | "enterprise"
  billingEmail: string
  features: string[]
  seats: number
  usedSeats: number
  customBranding: boolean
  ssoEnabled: boolean
  apiAccess: boolean
  dedicatedSupport: boolean
  createdAt: string
  settings: OrganizationSettings
}

export interface OrganizationSettings {
  allowedDomains: string[]
  requireTwoFactor: boolean
  dataRetentionDays: number
  customRoles: CustomRole[]
  apiRateLimits: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  webhooks: {
    url: string
    events: string[]
    secret: string
  }[]
  compliance: {
    gdprEnabled: boolean
    hipaaEnabled: boolean
    soc2Certified: boolean
  }
}

export interface CustomRole {
  id: string
  name: string
  permissions: string[]
  description: string
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: "owner" | "admin" | "member" | string
  permissions: string[]
  joinedAt: string
  lastActiveAt: string
}

export interface APIKey {
  id: string
  organizationId: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  expiresAt?: string
  lastUsedAt?: string
  createdBy: string
  createdAt: string
  revoked: boolean
}

class EnterpriseService {
  private supabase: ReturnType<typeof createClient> | null = null

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  }

  // Create a new organization
  async createOrganization(
    name: string,
    slug: string,
    tier: Organization["tier"],
    ownerId: string,
  ): Promise<Organization> {
    const features = this.getTierFeatures(tier)
    const seats = this.getTierSeats(tier)

    const organization: Partial<Organization> = {
      id: crypto.randomUUID(),
      name,
      slug,
      tier,
      billingEmail: "",
      features,
      seats,
      usedSeats: 1,
      customBranding: tier === "enterprise",
      ssoEnabled: tier === "enterprise",
      apiAccess: tier !== "starter",
      dedicatedSupport: tier === "enterprise",
      createdAt: new Date().toISOString(),
      settings: {
        allowedDomains: [],
        requireTwoFactor: tier === "enterprise",
        dataRetentionDays: tier === "enterprise" ? 730 : 365,
        customRoles: [],
        apiRateLimits: {
          requestsPerMinute: tier === "enterprise" ? 1000 : tier === "professional" ? 300 : 100,
          requestsPerDay: tier === "enterprise" ? 100000 : tier === "professional" ? 30000 : 10000,
        },
        webhooks: [],
        compliance: {
          gdprEnabled: true,
          hipaaEnabled: tier === "enterprise",
          soc2Certified: tier === "enterprise",
        },
      },
    }

    if (this.supabase) {
      await this.supabase.from("organizations").insert(organization)

      // Add owner as first member
      await this.addOrganizationMember(organization.id!, ownerId, "owner")
    }

    return organization as Organization
  }

  // Get tier features
  private getTierFeatures(tier: Organization["tier"]): string[] {
    const baseFeatures = ["social_feed", "messaging", "video_reels", "fundraising", "peer_support"]

    const professionalFeatures = [
      ...baseFeatures,
      "advanced_analytics",
      "api_access",
      "custom_branding",
      "priority_support",
      "bulk_operations",
    ]

    const enterpriseFeatures = [
      ...professionalFeatures,
      "sso",
      "advanced_security",
      "dedicated_support",
      "custom_integrations",
      "white_label",
      "compliance_tools",
      "audit_logs",
      "data_export",
      "custom_roles",
    ]

    switch (tier) {
      case "starter":
        return baseFeatures
      case "professional":
        return professionalFeatures
      case "enterprise":
        return enterpriseFeatures
      default:
        return baseFeatures
    }
  }

  // Get tier seats
  private getTierSeats(tier: Organization["tier"]): number {
    switch (tier) {
      case "starter":
        return 5
      case "professional":
        return 25
      case "enterprise":
        return 999
      default:
        return 5
    }
  }

  // Add organization member
  async addOrganizationMember(
    organizationId: string,
    userId: string,
    role: OrganizationMember["role"],
  ): Promise<OrganizationMember> {
    const member: OrganizationMember = {
      id: crypto.randomUUID(),
      organizationId,
      userId,
      role,
      permissions: this.getRolePermissions(role),
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    }

    if (this.supabase) {
      await this.supabase.from("organization_members").insert(member)
    }

    return member
  }

  // Get role permissions
  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      owner: ["*"],
      admin: [
        "manage_members",
        "manage_billing",
        "manage_settings",
        "view_analytics",
        "manage_api_keys",
        "manage_webhooks",
      ],
      member: ["view_content", "create_content", "view_analytics"],
    }

    return permissions[role] || permissions.member
  }

  // Create API key
  async createAPIKey(
    organizationId: string,
    name: string,
    permissions: string[],
    createdBy: string,
    expiresAt?: Date,
  ): Promise<APIKey> {
    const key = `mk_${crypto.randomUUID().replace(/-/g, "")}`

    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      organizationId,
      name,
      key,
      permissions,
      rateLimit: 1000,
      expiresAt: expiresAt?.toISOString(),
      createdBy,
      createdAt: new Date().toISOString(),
      revoked: false,
    }

    if (this.supabase) {
      await this.supabase.from("api_keys").insert(apiKey)
    }

    return apiKey
  }

  // Verify API key
  async verifyAPIKey(key: string): Promise<APIKey | null> {
    if (!this.supabase) return null

    const { data } = await this.supabase.from("api_keys").select("*").eq("key", key).eq("revoked", false).single()

    if (!data) return null

    // Check expiration
    if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
      return null
    }

    // Update last used
    await this.supabase.from("api_keys").update({ lastUsedAt: new Date().toISOString() }).eq("id", data.id)

    return data
  }

  // Add webhook
  async addWebhook(organizationId: string, url: string, events: string[], secret: string): Promise<void> {
    if (!this.supabase) return

    const { data: org } = await this.supabase.from("organizations").select("settings").eq("id", organizationId).single()

    if (org) {
      const webhooks = [...(org.settings.webhooks || []), { url, events, secret }]
      await this.supabase.from("organizations").update({ "settings.webhooks": webhooks }).eq("id", organizationId)
    }
  }

  // Get organization usage statistics
  async getOrganizationUsage(organizationId: string): Promise<{
    apiCalls: number
    storageUsed: number
    activeUsers: number
    contentCreated: number
  }> {
    if (!this.supabase) {
      return {
        apiCalls: 0,
        storageUsed: 0,
        activeUsers: 0,
        contentCreated: 0,
      }
    }

    // Get usage statistics
    const [apiCalls, users, content] = await Promise.all([
      this.supabase.from("api_logs").select("count").eq("organization_id", organizationId),
      this.supabase.from("organization_members").select("count").eq("organization_id", organizationId),
      this.supabase.from("posts").select("count").eq("organization_id", organizationId),
    ])

    return {
      apiCalls: apiCalls.count || 0,
      storageUsed: 0, // Would need to calculate from media uploads
      activeUsers: users.count || 0,
      contentCreated: content.count || 0,
    }
  }
}

export const enterpriseService = new EnterpriseService()
