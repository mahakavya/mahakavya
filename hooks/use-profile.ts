"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./use-auth"

interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  phone?: string
  date_of_birth?: string
  onboarding_complete: boolean
  role: string
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/me")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      setProfile(data.profile)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const data = await response.json()
      setProfile(data.profile)
      return data.profile
    } catch (err) {
      console.error("Error updating profile:", err)
      throw err
    }
  }

  const completeOnboarding = async (profileData: Partial<Profile>) => {
    try {
      const response = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileData,
          onboarding_complete: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to complete onboarding")
      }

      const data = await response.json()
      setProfile(data.profile)
      return data.profile
    } catch (err) {
      console.error("Error completing onboarding:", err)
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    completeOnboarding,
    refetch: fetchProfile,
  }
}
