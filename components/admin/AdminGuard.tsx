"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AdminGuardProps {
  children: React.ReactNode
  isAdmin?: boolean
}

export function AdminGuard({ children, isAdmin }: AdminGuardProps) {
  const [clientIsAdmin, setClientIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If server-side prop is provided, use it
    if (typeof isAdmin === "boolean") {
      setClientIsAdmin(isAdmin)
      return
    }

    // Client-side fallback check
    const checkAdmin = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/admin/me")
        if (response.ok) {
          const data = await response.json()
          setClientIsAdmin(data.isAdmin)
        } else {
          setClientIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        setClientIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (clientIsAdmin === false) {
    return (
      <EmptyState
        title="Access Denied"
        description="You don't have permission to access the admin console."
        action={
          <Button asChild>
            <Link href="/">Return to Dashboard</Link>
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
