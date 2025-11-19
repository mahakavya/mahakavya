import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  email?: string
  role?: string
  subscription_status?: string
  subscription_expires_at?: string
  is_admin?: boolean
  is_premium?: boolean
}

export type AccessLevel =
  | "canRead"
  | "canComment"
  | "canLike"
  | "canWrite"
  | "canCreateCampaigns"
  | "canAccessPremiumFeatures"
  | "canModerate"
  | "canAdmin"
  | "canManageUsers"

export function checkAccess(user: User | UserProfile | null, permission: AccessLevel): boolean {
  if (!user) {
    // Guest users can only read
    return permission === "canRead"
  }

  const profile = user as UserProfile
  const isAdmin = profile.is_admin || profile.role === "admin" || profile.role === "moderator"
  const isPremium =
    profile.is_premium || isValidSubscription(profile.subscription_status, profile.subscription_expires_at)

  switch (permission) {
    case "canRead":
      return true // All authenticated users can read

    case "canComment":
    case "canLike":
      return true // All authenticated users can interact

    case "canWrite":
    case "canCreateCampaigns":
    case "canAccessPremiumFeatures":
      return isPremium || isAdmin // Premium features require subscription or admin

    case "canModerate":
    case "canAdmin":
    case "canManageUsers":
      return isAdmin // Admin-only features

    default:
      return false
  }
}

function isValidSubscription(status?: string, expiresAt?: string): boolean {
  if (!status || status !== "active") return false
  if (!expiresAt) return false

  const expirationDate = new Date(expiresAt)
  const now = new Date()

  return expirationDate > now
}

export function getUserRole(user: User | UserProfile | null): "guest" | "user" | "premium" | "admin" {
  if (!user) return "guest"

  const profile = user as UserProfile

  if (profile.is_admin || profile.role === "admin" || profile.role === "moderator") {
    return "admin"
  }

  if (profile.is_premium || isValidSubscription(profile.subscription_status, profile.subscription_expires_at)) {
    return "premium"
  }

  return "user"
}

export function canAccessFeature(user: User | UserProfile | null, feature: string): boolean {
  const role = getUserRole(user)

  const featurePermissions: Record<string, string[]> = {
    "social-feed": ["guest", "user", "premium", "admin"],
    "post-creation": ["premium", "admin"],
    "campaign-creation": ["premium", "admin"],
    reels: ["premium", "admin"],
    messaging: ["user", "premium", "admin"],
    "admin-panel": ["admin"],
    moderation: ["admin"],
    analytics: ["premium", "admin"],
  }

  const allowedRoles = featurePermissions[feature] || []
  return allowedRoles.includes(role)
}

export function requireAuth(user: User | null): asserts user is User {
  if (!user) {
    throw new Error("Authentication required")
  }
}

export function requirePremium(user: User | UserProfile | null): void {
  if (!checkAccess(user, "canAccessPremiumFeatures")) {
    throw new Error("Premium subscription required")
  }
}

export function requireAdmin(user: User | UserProfile | null): void {
  if (!checkAccess(user, "canAdmin")) {
    throw new Error("Admin access required")
  }
}

export async function validateAdmin(userId?: string): Promise<{ valid: boolean }> {
  if (!userId) return { valid: false }
  return { valid: checkAccess({ id: userId, is_admin: true }, "canAdmin") }
}

// Export default for compatibility
export default {
  checkAccess,
  getUserRole,
  canAccessFeature,
  requireAuth,
  requirePremium,
  requireAdmin,
  validateAdmin,
}
