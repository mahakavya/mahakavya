"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Loader2, Shield, Zap, LinkIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface SignupProgress {
  step: string
  status: "pending" | "loading" | "success" | "warning" | "error"
  message: string
}

interface ServiceStatus {
  ai: "available" | "unavailable" | "unknown"
  blockchain: "available" | "unavailable" | "unknown"
  rpa: "available" | "unavailable" | "unknown"
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [progress, setProgress] = useState<SignupProgress[]>([])
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    ai: "unknown",
    blockchain: "unknown",
    rpa: "unknown",
  })
  const [overallProgress, setOverallProgress] = useState(0)

  const router = useRouter()
  const supabase = createClient()

  const updateProgress = (step: string, status: SignupProgress["status"], message: string) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.step === step)
      if (existing) {
        existing.status = status
        existing.message = message
        return [...prev]
      }
      return [...prev, { step, status, message }]
    })
  }

  const performSecurityAnalysis = async (email: string, password: string, userData: any) => {
    updateProgress("security", "loading", "Analyzing signup security...")

    try {
      const response = await fetch("/api/security/analyze-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userData }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.status === "ai_unavailable") {
          setServiceStatus((prev) => ({ ...prev, ai: "unavailable" }))
          updateProgress("security", "warning", "Basic security check completed (AI analysis unavailable)")
        } else {
          setServiceStatus((prev) => ({ ...prev, ai: "available" }))
          updateProgress("security", "success", "Security analysis completed successfully")
        }
        return result
      } else {
        updateProgress("security", "warning", "Security analysis failed, proceeding with basic checks")
        return { aiVerified: false, threatLevel: "low" }
      }
    } catch (error) {
      console.error("Security analysis error:", error)
      setServiceStatus((prev) => ({ ...prev, ai: "unavailable" }))
      updateProgress("security", "warning", "Security analysis unavailable, using basic validation")
      return { aiVerified: false, threatLevel: "low" }
    }
  }

  const performBlockchainRegistration = async (userId: string, email: string, fullName: string) => {
    updateProgress("blockchain", "loading", "Registering on blockchain...")

    try {
      const response = await fetch("/api/security/blockchain-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          fullName,
          timestamp: new Date().toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.status === "service_unavailable" || result.status === "api_key_missing") {
          setServiceStatus((prev) => ({ ...prev, blockchain: "unavailable" }))
          updateProgress("blockchain", "warning", "Blockchain registration skipped (service not configured)")
        } else if (result.verified) {
          setServiceStatus((prev) => ({ ...prev, blockchain: "available" }))
          updateProgress("blockchain", "success", "Blockchain verification completed")
        } else {
          setServiceStatus((prev) => ({ ...prev, blockchain: "unavailable" }))
          updateProgress("blockchain", "warning", "Blockchain registration failed, continuing without verification")
        }
        return result
      } else {
        updateProgress("blockchain", "warning", "Blockchain registration failed")
        return { transactionHash: null, verified: false }
      }
    } catch (error) {
      console.error("Blockchain registration error:", error)
      setServiceStatus((prev) => ({ ...prev, blockchain: "unavailable" }))
      updateProgress("blockchain", "warning", "Blockchain service unavailable")
      return { transactionHash: null, verified: false }
    }
  }

  const performRPAPostSignup = async (userId: string, email: string, fullName: string) => {
    updateProgress("rpa", "loading", "Setting up automation...")

    try {
      const response = await fetch("/api/rpa/post-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email,
          profile: { fullName, email },
          preferences: {
            language: "en",
            notifications: true,
            culturalContent: true,
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (result.automationStatus === "disabled" || result.automationStatus === "setup_failed") {
          setServiceStatus((prev) => ({ ...prev, rpa: "unavailable" }))
          updateProgress("rpa", "warning", "RPA automation skipped (service not configured)")
        } else if (result.rpaEnabled) {
          setServiceStatus((prev) => ({ ...prev, rpa: "available" }))
          updateProgress("rpa", "success", "Automation setup completed")
        } else {
          setServiceStatus((prev) => ({ ...prev, rpa: "unavailable" }))
          updateProgress("rpa", "warning", "Automation setup failed, continuing without RPA")
        }
        return result
      } else {
        updateProgress("rpa", "warning", "RPA setup failed")
        return { rpaEnabled: false }
      }
    } catch (error) {
      console.error("RPA post-signup error:", error)
      setServiceStatus((prev) => ({ ...prev, rpa: "unavailable" }))
      updateProgress("rpa", "warning", "RPA service unavailable")
      return { rpaEnabled: false }
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    setProgress([])
    setOverallProgress(0)

    try {
      // Validation
      if (password !== confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        return
      }

      updateProgress("account", "loading", "Creating your account...")
      setOverallProgress(20)

      // Step 1: Create account with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        updateProgress("account", "error", `Account creation failed: ${signUpError.message}`)
        return
      }

      if (!data.user) {
        setError("Failed to create account")
        updateProgress("account", "error", "Account creation failed")
        return
      }

      updateProgress("account", "success", "Account created successfully")
      setOverallProgress(40)

      // Step 2: Security Analysis (non-blocking)
      const securityResult = await performSecurityAnalysis(email, password, { fullName, email })
      setOverallProgress(60)

      // Step 3: Blockchain Registration (non-blocking)
      const blockchainResult = await performBlockchainRegistration(data.user.id, email, fullName)
      setOverallProgress(80)

      // Step 4: RPA Post-Signup (non-blocking)
      const rpaResult = await performRPAPostSignup(data.user.id, email, fullName)
      setOverallProgress(100)

      // Success - redirect based on email confirmation requirement
      if (data.user.email_confirmed_at) {
        setSuccess("Account created successfully! Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/samvaaha?welcome=true")
        }, 2000)
      } else {
        setSuccess("Account created successfully! Please check your email to verify your account before signing in.")
        setTimeout(() => {
          router.push("/sanketa/signin?message=Please check your email to verify your account")
        }, 3000)
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("An unexpected error occurred. Please try again.")
      updateProgress("account", "error", "Signup failed due to unexpected error")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: SignupProgress["status"]) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getServiceStatusBadge = (service: keyof ServiceStatus, label: string) => {
    const status = serviceStatus[service]
    const variant = status === "available" ? "default" : status === "unavailable" ? "secondary" : "outline"
    const icon = service === "ai" ? Shield : service === "blockchain" ? LinkIcon : Zap
    const IconComponent = icon

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {label}: {status === "available" ? "Active" : status === "unavailable" ? "Offline" : "Unknown"}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-600">Join Mahakavya</CardTitle>
          <CardDescription>Create your account to access our social platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="w-full" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Setup Progress</h4>
                  {progress.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {getStatusIcon(item.status)}
                      <span className="flex-1">{item.message}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Service Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {getServiceStatusBadge("ai", "AI Security")}
                    {getServiceStatusBadge("blockchain", "Blockchain")}
                    {getServiceStatusBadge("rpa", "Automation")}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/sanketa/signin" className="text-orange-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
