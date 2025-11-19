"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SacredLogo } from "@/components/sacred-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Focus as Lotus, ArrowRight, Sparkles } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "🕉️ Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password)

      if (error) {
        toast({
          title: "🕉️ Registration Error",
          description: error.message || "Failed to create account",
          variant: "destructive",
        })
      } else {
        toast({
          title: "🕉️ Welcome to Mahakavya!",
          description: "Your sacred journey begins now...",
        })
        router.push("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      <Card className="w-full max-w-md border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <SacredLogo
              variant="full"
              className="transform hover:scale-110 transition-transform duration-300"
              animated={true}
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            🕉️ Join Sacred Journey ॐ
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            Begin your spiritual heritage adventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-amber-800 dark:text-amber-200 font-medium">
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 border-amber-200 focus:border-amber-500 hover:border-amber-400 transition-all duration-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-800 dark:text-amber-200 font-medium">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 border-amber-200 focus:border-amber-500 hover:border-amber-400 transition-all duration-300"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-amber-800 dark:text-amber-200 font-medium">
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 border-amber-200 focus:border-amber-500 hover:border-amber-400 transition-all duration-300"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-white font-bold py-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Lotus className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Join Sacred Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 underline hover:no-underline transition-all duration-300"
              >
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
