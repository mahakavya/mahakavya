"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Optimized submit handler with better error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Quick validation
      if (!email || !password) {
        setError("Please enter both email and password")
        return
      }

      setError("")
      setIsLoading(true)

      try {
        // Start signin process
        const startTime = performance.now()
        console.log("🔐 Starting signin process...")

        const { error: signInError } = await signIn(email, password)

        const endTime = performance.now()
        console.log(`🔐 Signin completed in ${Math.round(endTime - startTime)}ms`)

        if (signInError) {
          // Provide specific error messages
          let errorMessage = ""
          switch (signInError.message) {
            case "Invalid login credentials":
              errorMessage = "Invalid email or password. Please check your credentials and try again."
              break
            case "Email not confirmed":
              errorMessage = "Please check your email and click the confirmation link before signing in."
              break
            case "Too many requests":
              errorMessage = "Too many sign-in attempts. Please wait a moment before trying again."
              break
            case "User not found":
              errorMessage = "No account found with this email address."
              break
            default:
              errorMessage = signInError.message || "An error occurred during sign in"
          }

          setError(errorMessage)
          toast({
            title: "Sign in failed",
            description: errorMessage,
            variant: "destructive",
          })
        } else {
          // Success - show immediate feedback
          toast({
            title: "Welcome back! 🕉️",
            description: "You have been signed in successfully.",
          })

          // Navigate immediately without waiting
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Signin error:", err)
        const errorMessage = "An unexpected error occurred. Please try again."
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [email, password, signIn, toast, router],
  )

  // Quick environment check (non-blocking)
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500">
            <div className="text-white text-xl font-bold">卍</div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Mahakavya
          </CardTitle>
          <CardDescription className="text-gray-600">Social Platform</CardDescription>
          <div className="mt-2">
            <h2 className="text-xl font-semibold text-orange-600 flex items-center justify-center gap-2">
              Sacred Sign In 🕉️
            </h2>
            <p className="text-sm text-gray-600 mt-1">Welcome back to your spiritual journey</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Development Debug Panel - Only show if there are issues */}
          {process.env.NODE_ENV === "development" && !isSupabaseConfigured && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Configuration Issue:</strong>
                <br />
                Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
                to your .env.local file
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-orange-200 focus:border-orange-500"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-orange-200 focus:border-orange-500 pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all duration-200"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>🕉️ Sign In →</>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/signup" className="text-orange-600 hover:text-orange-700 font-medium">
              Join Sacred Journey
            </Link>
          </div>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700">
              Forgot your password?
            </Link>
          </div>

          {/* Performance indicator for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-400 text-center">🚀 Optimized for fast authentication</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
