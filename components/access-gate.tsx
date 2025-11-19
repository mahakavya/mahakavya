"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { useAuth } from "@/hooks/use-auth"

interface AccessGateProps {
  children: React.ReactNode
  feature: "feed" | "reels" | "messaging" | "fundraising" | "emotional" | "luckydraw"
}

export function AccessGate({ children, feature }: AccessGateProps) {
  const { user, hasAccess, isLoading } = useAuth()
  const [hasFeatureAccess, setHasFeatureAccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const access = await hasAccess(feature)
        setHasFeatureAccess(access)
      } catch (error) {
        console.error("Error checking access:", error)
        setHasFeatureAccess(false)
      } finally {
        setChecking(false)
      }
    }

    if (!isLoading) {
      checkAccess()
    }
  }, [user, feature, hasAccess, isLoading, router])

  if (isLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (!hasFeatureAccess) {
    return (
      <EmptyState
        icon={Lock}
        title="Premium Feature"
        description={`Access to ${feature} requires an active subscription. Upgrade your plan to unlock this feature.`}
        action={
          <Button onClick={() => router.push("/yojana")} className="heritage-button">
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
