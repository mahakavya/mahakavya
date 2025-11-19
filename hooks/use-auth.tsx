"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session cache to prevent excessive API calls
let sessionCache: { session: Session | null; timestamp: number } | null = null
const CACHE_DURATION = 60000 // 1 minute

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const supabase = createClient()
      const {
        data: { session: newSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Error refreshing session:", error)

        // Don't throw on network errors, use cached session
        if (error.message.includes("fetch") && sessionCache) {
          setSession(sessionCache.session)
          setUser(sessionCache.session?.user ?? null)
          return
        }

        return
      }

      setSession(newSession)
      setUser(newSession?.user ?? null)

      // Update cache
      sessionCache = { session: newSession, timestamp: Date.now() }
    } catch (error) {
      console.error("Session refresh error:", error)

      // Use cached session on network error
      if (sessionCache) {
        setSession(sessionCache.session)
        setUser(sessionCache.session?.user ?? null)
      }
    }
  }

  const signOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error && !error.message.includes("fetch")) {
        throw error
      }

      // Clear state regardless of network error
      setUser(null)
      setSession(null)
      sessionCache = null
    } catch (error) {
      console.error("Sign out error:", error)

      // Clear local state even if network call fails
      setUser(null)
      setSession(null)
      sessionCache = null

      // Don't throw on network errors
      if (error instanceof Error && !error.message.includes("fetch")) {
        throw error
      }
    }
  }

  useEffect(() => {
    let mounted = true

    // Check cache first
    const now = Date.now()
    if (sessionCache && now - sessionCache.timestamp < CACHE_DURATION) {
      setSession(sessionCache.session)
      setUser(sessionCache.session?.user ?? null)
      setLoading(false)
      return
    }

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting initial session:", error)

          // Use cached session on error if available
          if (sessionCache && mounted) {
            setSession(sessionCache.session)
            setUser(sessionCache.session?.user ?? null)
            setLoading(false)
            return
          }
        }

        if (mounted) {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)
          setLoading(false)

          // Cache the session
          sessionCache = { session: initialSession, timestamp: Date.now() }
        }
      } catch (error) {
        console.error("Initial session error:", error)

        if (mounted) {
          // Use cached session on network error
          if (sessionCache) {
            setSession(sessionCache.session)
            setUser(sessionCache.session?.user ?? null)
          }
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes with error handling
    let lastAuthChange = 0
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, newSession: Session | null) => {
      const now = Date.now()

      // Throttle auth state changes
      if (now - lastAuthChange < 2000) {
        return
      }
      lastAuthChange = now

      console.log("Auth state changed:", event)

      if (mounted) {
  setSession(newSession)
  setUser(newSession?.user ?? null)
        setLoading(false)

        // Update cache
  sessionCache = { session: newSession, timestamp: now }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
