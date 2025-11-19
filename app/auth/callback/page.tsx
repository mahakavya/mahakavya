"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth callback error:", error)
          router.push("/login?error=callback_error")
          return
        }

        if (data.session) {
          router.push("/dashboard")
        } else {
          router.push("/login")
        }
      } catch (error) {
        console.error("Unexpected error:", error)
        router.push("/login?error=unexpected_error")
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
          <p className="text-gray-600">Please wait while we redirect you...</p>
        </CardContent>
      </Card>
    </div>
  )
}
