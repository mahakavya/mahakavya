"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Github, Mail, Shield, Wifi, WifiOff, AlertTriangle, CheckCircle } from "lucide-react"
import { signInWithPassword, createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

interface SecurityStatus {
  network: "online" | "offline" | "checking"
  rateLimit: number
  lastAttempt: number | null
}

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  // Memoize URL parameters to prevent re-renders
  const urlParams = useMemo(
    () => ({
      redirectTo: searchParams.get("redirect") || "/samvaaha",
      messageParam: searchParams.get("message") || null,
    }),
    [searchParams],
  )

  // Form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Security and network state
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    network: "checking",
    rateLimit: 0,
    lastAttempt: null,
  })

  // Rate limit countdown
  const [countdown, setCountdown] = useState(0)

  // Initialize message from URL params (only once)
  useEffect(() => {
    if (urlParams.messageParam) {
      switch (urlParams.messageParam) {
        case "signup_success":
          setMessage("Account created successfully! Please check your email to verify your account.")
          break
        case "email_confirmed":
          setMessage("Email confirmed successfully! You can now sign in.")
          break
        case "password_reset":
          setMessage("Password reset email sent! Check your inbox.")
          break
        case "session_expired":
          setError("Your session has expired. Please sign in again.")
          break
        case "admin_required":
          setError("Admin access required for this page.")
          break
        default:
          break
      }
    }
  }, [urlParams.messageParam])

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push(urlParams.redirectTo)
    }
  }, [user, authLoading, router, urlParams.redirectTo])

  // Network connectivity monitoring
  useEffect(() => {
    const updateNetworkStatus = () => {
      setSecurityStatus((prev) => ({
        ...prev,
        network: navigator.onLine ? "online" : "offline",
      }))
    }

    // Initial check
    updateNetworkStatus()

    // Add event listeners
    window.addEventListener("online", updateNetworkStatus)
    window.addEventListener("offline", updateNetworkStatus)

    return () => {
      window.removeEventListener("online", updateNetworkStatus)
      window.removeEventListener("offline", updateNetworkStatus)
    }
  }, [])

  // Rate limit countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [countdown])

  // Handle signin with proper error handling
  const handleSignin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (loading || countdown > 0) return

      setLoading(true)
      setError(null)
      setMessage(null)

      try {
        const now = Date.now()

        // Update rate limit tracking
        setSecurityStatus((prev) => ({
          ...prev,
          rateLimit: prev.rateLimit + 1,
          lastAttempt: now,
        }))

        await signInWithPassword(email, password)

        // Success - redirect will happen via useEffect
        setMessage("Sign in successful! Redirecting...")
      } catch (err) {
        console.error("Signin error:", err)

        const errorMessage = err instanceof Error ? err.message : "Sign in failed"
        setError(errorMessage)

        // Set countdown for rate limiting on error
        if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
          setCountdown(60) // 1 minute cooldown
        }
      } finally {
        setLoading(false)
      }
    },
    [email, password, loading, countdown],
  )

  // Handle OAuth signin
  const handleOAuthSignin = useCallback(
    async (provider: "google" | "github") => {
      if (loading || countdown > 0) return

      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(urlParams.redirectTo)}`,
          },
        })

        if (error) throw error
      } catch (err) {
        console.error(`${provider} signin error:`, err)
        setError(err instanceof Error ? err.message : `${provider} sign in failed`)
      } finally {
        setLoading(false)
      }
    },
    [loading, countdown, urlParams.redirectTo],
  )

  // Service status badge component
  const getServiceStatusBadge = useCallback(() => {
    const { network, rateLimit } = securityStatus

    if (network === "offline") {
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )
    }

    if (rateLimit > 5) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Rate Limited
        </Badge>
      )
    }

    if (network === "online") {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Online
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Wifi className="h-3 w-3" />
        Checking...
      </Badge>
    )
  }, [securityStatus])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render if user is already authenticated (will redirect)
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            {getServiceStatusBadge()}
          </div>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Rate Limit Warning */}
          {countdown > 0 && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Too many attempts. Please wait {countdown} seconds before trying again.
              </AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleOAuthSignin("google")}
              disabled={loading || countdown > 0 || securityStatus.network === "offline"}
            >
              <Mail className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => handleOAuthSignin("github")}
              disabled={loading || countdown > 0 || securityStatus.network === "offline"}
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || countdown > 0}
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
                  disabled={loading || countdown > 0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || countdown > 0 || securityStatus.network === "offline"}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Signing in...
                </>
              ) : countdown > 0 ? (
                `Wait ${countdown}s`
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push(`/sanketa/signup?redirect=${encodeURIComponent(urlParams.redirectTo)}`)}
              >
                Sign up
              </Button>
            </p>
            <p>
              Forgot your password?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/sanketa/reset-password")}
              >
                Reset password
              </Button>
            </p>
          </div>

          {/* Security Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Network: {securityStatus.network}</p>
            {securityStatus.rateLimit > 0 && <p>Login attempts: {securityStatus.rateLimit}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
