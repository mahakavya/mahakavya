import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
}

// Singleton pattern for client-side Supabase client to avoid recreating
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Rate limiting for auth operations
const authRateLimit = {
  calls: 0,
  resetTime: Date.now() + 60000, // Reset every minute
  maxCalls: 10, // Max calls per minute
}

function checkRateLimit(): boolean {
  const now = Date.now()

  if (now > authRateLimit.resetTime) {
    authRateLimit.calls = 0
    authRateLimit.resetTime = now + 60000
  }

  if (authRateLimit.calls >= authRateLimit.maxCalls) {
    console.warn("Auth rate limit reached, throttling requests")
    return false
  }

  authRateLimit.calls++
  return true
}

// Network connectivity check
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch("/api/health", {
      method: "HEAD",
      cache: "no-cache",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.debug("Network connectivity check failed:", error)
    return false
  }
}

// Enhanced fetch with retry logic
export async function fetchWithRetry(
  url: string | URL | Request,
  options: RequestInit = {},
  maxRetries = 3,
): Promise<Response> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok || i === maxRetries) {
        return response
      }

      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    } catch (error) {
      lastError = error as Error
      if (i === maxRetries) {
        throw lastError
      }
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }

  throw lastError!
}

// Create client-side Supabase client with enhanced error handling
export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-client-info": "mahakavya-social@1.0.0",
      },
      fetch: (url, options = {}) => {
        // Enhanced fetch with timeout and retry logic
        return fetchWithRetry(url, options)
      },
    },
    // Reduce realtime connection overhead
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  })

  return supabaseInstance
}

// Create server-side Supabase client
export async function createSupabaseServerActionClient() {
  const { cookies } = await import("next/headers")
  const { createServerClient } = await import("@supabase/ssr")

  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Export factory bindings
export const createSupabaseClient: any = createClient
export const createSupabaseBrowserClient: any = createClient
export const createSupabaseServerClient: any = createSupabaseServerActionClient
export const createSupabaseAdminClient: any = createClient

// Session cache for client-side
let cachedSession: any = null
let sessionCacheTime = 0
const SESSION_CACHE_DURATION = 30000 // 30 seconds

// Helper functions for client-side operations with enhanced error handling
export async function getCurrentUser() {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please wait before trying again.")
  }

  // Check network connectivity first
  const isOnline = await checkNetworkConnectivity()
  if (!isOnline) {
    throw new Error("Network connection unavailable. Please check your internet connection.")
  }

  const supabase = createClient()

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Error getting current user:", error)

      if (error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection and try again.")
      }

      return null
    }

    return user
  } catch (error) {
    console.error("Auth error:", error)

    if (error instanceof Error) {
      if (error.message.includes("fetch") || error.message.includes("network")) {
        throw new Error("Network connection failed. Please check your internet connection.")
      }
      throw error
    }

    throw new Error("Authentication service temporarily unavailable")
  }
}

export async function getCurrentSession() {
  const now = Date.now()

  // Return cached session if still valid
  if (cachedSession && now - sessionCacheTime < SESSION_CACHE_DURATION) {
    return cachedSession
  }

  const supabase = createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Session fetch error:", error)
      return null
    }

    // Cache the session
    cachedSession = session
    sessionCacheTime = now

    return session
  } catch (error) {
    console.error("Session fetch failed:", error)
    return null
  }
}

export async function signOut() {
  if (!checkRateLimit()) {
    throw new Error("Rate limit exceeded. Please wait before trying again.")
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)

      if (error.message.includes("fetch")) {
        // Clear local session even if network call fails
        clearSessionCache()
        return
      }

      throw error
    }

    // Clear session cache
    clearSessionCache()
  } catch (error) {
    console.error("Signout error:", error)

    // Clear local session even on error
    clearSessionCache()

    if (error instanceof Error && error.message.includes("fetch")) {
      // Don't throw on network errors for signout
      return
    }

    throw new Error("Sign out failed. Please try again.")
  }
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    console.error("Error signing in:", error)

    // Handle specific error types
    if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
      throw new Error("Network connection failed. Please check your internet connection and try again.")
    }

    if (error.message.includes("rate limit") || error.message.includes("too many")) {
      throw new Error("Too many login attempts. Please wait a few minutes before trying again.")
    }

    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password. Please check your credentials.")
    }

    if (error.message.includes("Email not confirmed")) {
      throw new Error("Please check your email and click the confirmation link before signing in.")
    }

    throw new Error(error.message || "Sign in failed. Please try again.")
  }

  // Clear and update session cache
  clearSessionCache()
  cachedSession = data.session
  sessionCacheTime = Date.now()
  return data
}

export async function signUpWithPassword(
  email: string,
  password: string,
  options?: {
    data?: Record<string, any>
  },
) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      ...options,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    console.error("Error signing up:", error)

    if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
      throw new Error("Network connection failed. Please check your internet connection and try again.")
    }

    if (error.message.includes("rate limit") || error.message.includes("too many")) {
      throw new Error("Too many signup attempts. Please wait a few minutes before trying again.")
    }

    throw new Error(error.message || "Sign up failed. Please try again.")
  }

  return data
}

export async function resetPassword(email: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
  })

  if (error) {
    throw error
  }
}

export async function updatePassword(password: string) {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw error
  }
}

// Database helpers with enhanced error handling
const queryCache = new Map<string, { data: any; timestamp: number }>()
const QUERY_CACHE_DURATION = 300000 // 5 minutes

export async function getUserProfile(userId: string) {
  const cacheKey = `profile-${userId}`
  const cached = queryCache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < QUERY_CACHE_DURATION) {
    return cached.data
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user profile:", error)

      // Return cached data on error if available
      if (cached) {
        return cached.data
      }

      return null
    }

    // Cache the result
    queryCache.set(cacheKey, { data, timestamp: now })
    return data
  } catch (error) {
    console.error("Profile fetch error:", error)

    // Return cached data on network error
    if (cached) {
      return cached.data
    }

    return null
  }
}

export async function updateUserProfile(userId: string, updates: Record<string, any>) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single()

    if (error) {
      console.error("Error updating user profile:", error)

      if (error.message.includes("fetch")) {
        throw new Error("Network connection failed. Please check your internet connection and try again.")
      }

      throw error
    }

    // Invalidate cache
    queryCache.delete(`profile-${userId}`)
    return data
  } catch (error) {
    console.error("Profile update error:", error)

    if (error instanceof Error && error.message.includes("fetch")) {
      throw new Error("Network connection failed. Please try again.")
    }

    throw new Error("Profile update failed. Please try again.")
  }
}

// Export types
export type { Database }

// Clear session cache
export function clearSessionCache() {
  cachedSession = null
  sessionCacheTime = 0
}
