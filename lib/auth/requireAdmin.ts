import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

export interface AdminUser extends User {
  role?: string
  is_admin?: boolean
  permissions?: string[]
}

export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, permissions")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.is_admin || profile?.role === "admin" || profile?.role === "moderator"

  if (!isAdmin) {
    redirect("/")
  }

  return {
    ...user,
    role: profile?.role,
    is_admin: profile?.is_admin,
    permissions: profile?.permissions,
  } as AdminUser
}

export async function requireModerator(): Promise<AdminUser> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Check if user is moderator or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, permissions")
    .eq("id", user.id)
    .single()

  const canModerate =
    profile?.is_admin ||
    profile?.role === "admin" ||
    profile?.role === "moderator" ||
    profile?.permissions?.includes("moderate")

  if (!canModerate) {
    redirect("/")
  }

  return {
    ...user,
    role: profile?.role,
    is_admin: profile?.is_admin,
    permissions: profile?.permissions,
  } as AdminUser
}

export async function requirePremium(): Promise<User> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Check if user has premium subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_expires_at, is_premium, role")
    .eq("id", user.id)
    .single()

  const isPremium =
    profile?.is_premium ||
    profile?.role === "admin" ||
    (profile?.subscription_status === "active" &&
      profile?.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date())

  if (!isPremium) {
    redirect("/billing")
  }

  return user
}

export async function getUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getUserWithProfile(): Promise<(User & { profile?: any }) | null> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return {
    ...user,
    profile,
  }
}

export async function checkUserRole(userId: string): Promise<{
  isAdmin: boolean
  isModerator: boolean
  isPremium: boolean
  role: string | null
}> {
  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, is_premium, subscription_status, subscription_expires_at")
    .eq("id", userId)
    .single()

  const isAdmin = profile?.is_admin || profile?.role === "admin"
  const isModerator = isAdmin || profile?.role === "moderator"
  const isPremium =
    profile?.is_premium ||
    isAdmin ||
    (profile?.subscription_status === "active" &&
      profile?.subscription_expires_at &&
      new Date(profile.subscription_expires_at) > new Date())

  return {
    isAdmin,
    isModerator,
    isPremium,
    role: profile?.role || null,
  }
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin, permissions")
    .eq("id", userId)
    .single()

  // Admins have all permissions
  if (profile?.is_admin || profile?.role === "admin") {
    return true
  }

  // Check specific permissions
  const permissions = profile?.permissions || []
  return permissions.includes(permission)
}

export function createAuthGuard(requiredRole: "admin" | "moderator" | "premium" | "user" = "user") {
  return async function authGuard() {
    switch (requiredRole) {
      case "admin":
        return await requireAdmin()
      case "moderator":
        return await requireModerator()
      case "premium":
        return await requirePremium()
      case "user":
      default:
        const user = await getUser()
        if (!user) redirect("/login")
        return user
    }
  }
}

// Utility functions for checking access levels
export async function canAccessAdminPanel(userId: string): Promise<boolean> {
  const { isAdmin } = await checkUserRole(userId)
  return isAdmin
}

export async function canModerateContent(userId: string): Promise<boolean> {
  const { isModerator } = await checkUserRole(userId)
  return isModerator
}

export async function canAccessPremiumFeatures(userId: string): Promise<boolean> {
  const { isPremium } = await checkUserRole(userId)
  return isPremium
}

export async function canCreateCampaigns(userId: string): Promise<boolean> {
  const { isPremium } = await checkUserRole(userId)
  return isPremium
}

export async function canUploadReels(userId: string): Promise<boolean> {
  const { isPremium } = await checkUserRole(userId)
  return isPremium
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { isAdmin } = await checkUserRole(userId)
  return isAdmin
}

// Export default for compatibility
export default {
  requireAdmin,
  requireModerator,
  requirePremium,
  getUser,
  getUserWithProfile,
  checkUserRole,
  hasPermission,
  createAuthGuard,
  canAccessAdminPanel,
  canModerateContent,
  canAccessPremiumFeatures,
  canCreateCampaigns,
  canUploadReels,
  isAdmin,
}
