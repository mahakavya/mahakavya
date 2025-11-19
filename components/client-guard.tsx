"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useProfile } from "@/hooks/use-profile"
import { useSubscription } from "@/hooks/use-subscription"
import { Loader2 } from "lucide-react"

interface ClientGuardProps {
  children: React.ReactNode
}

export function ClientGuard({ children }: ClientGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const { subscription, loading: subscriptionLoading } = useSubscription()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (authLoading || profileLoading || subscriptionLoading || isRedirecting) {
      return
    }

    // Public routes that don't need guards
    const publicRoutes = [
      "/",
      "/sanketa/signin",
      "/sanketa/signup",
      "/auth/callback",
      "/prarambha",
      "/legal/terms",
      "/legal/privacy",
      "/legal/refunds",
      "/legal/cancellation",
    ]

    if (publicRoutes.includes(pathname)) {
      return
    }

    // Auth guard
    if (!user) {
      setIsRedirecting(true)
      router.push(`/sanketa/signin?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }

    // Profile completion guard
    const needsProfileRoutes = ["/samvaaha", "/nivedana", "/drishya", "/bhagyachakra", "/sahaya", "/varta"]
    const needsProfile = needsProfileRoutes.some((route) => pathname.startsWith(route))

    if (needsProfile && pathname !== "/onboarding/profile") {
      if (!profile?.onboarding_complete) {
        setIsRedirecting(true)
        router.push("/onboarding/profile")
        return
      }
    }

    // Subscription guard for core modules
    const coreModules = ["/samvaaha", "/nivedana", "/drishya", "/bhagyachakra", "/sahaya", "/varta"]
    const isCoreModule = coreModules.some((module) => pathname.startsWith(module))

    if (isCoreModule && pathname !== "/billing/subscribe") {
      const isActive = subscription?.status === "active" && new Date(subscription.current_period_end) > new Date()

      if (!isActive) {
        setIsRedirecting(true)
        router.push("/billing/subscribe")
        return
      }
    }

    // Admin guard
    if (pathname.startsWith("/admin")) {
      if (!profile || !["SUPER_ADMIN", "ADMIN"].includes(profile.role)) {
        setIsRedirecting(true)
        router.push("/samvaaha")
        return
      }
    }
  }, [user, profile, subscription, pathname, router, authLoading, profileLoading, subscriptionLoading, isRedirecting])

  // Show loading state
  if (authLoading || profileLoading || subscriptionLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
