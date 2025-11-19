"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Shield, CheckCircle, AlertCircle, Crown, Users } from "lucide-react"

export function AdminSetup() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const setupAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!email) {
      setError("Email is required")
      setLoading(false)
      return
    }

    try {
      // Call the setup_admin_user function
      const { data, error: functionError } = await supabase.rpc("setup_admin_user", {
        admin_email: email,
      })

      if (functionError) {
        setError(`Database error: ${functionError.message}`)
        return
      }

      if (data) {
        setSuccess(`Successfully set up admin user for ${email}`)
        // Refresh profile if it's the current user
        if (user?.email === email) {
          await refreshProfile()
        }
      } else {
        setError(`User with email ${email} not found. Please make sure they have signed up first.`)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Admin setup error:", err)
    } finally {
      setLoading(false)
    }
  }

  const makeCurrentUserAdmin = async () => {
    if (!user?.email) return
    setEmail(user.email)

    // Auto-submit the form
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data, error: functionError } = await supabase.rpc("setup_admin_user", {
        admin_email: user.email,
      })

      if (functionError) {
        setError(`Database error: ${functionError.message}`)
        return
      }

      if (data) {
        setSuccess(`Successfully promoted ${user.email} to admin!`)
        await refreshProfile()
      } else {
        setError("Failed to promote user to admin. Please try again.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error("Admin setup error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Setup
          </CardTitle>
          <CardDescription>
            Set up the first admin user for the platform. This user will have access to all features and the admin
            panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current User Status */}
          {user && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current User Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Admin Status:</span>
                  {profile?.is_admin ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Regular User
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <Badge variant="outline" className="capitalize">
                    {profile?.role || "user"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verified:</span>
                  <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                    {profile?.is_verified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </>
                    )}
                  </Badge>
                </div>
              </div>

              {!profile?.is_admin && (
                <Button
                  onClick={makeCurrentUserAdmin}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Promoting to Admin...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Make Me Admin
                    </>
                  )}
                </Button>
              )}

              {profile?.is_admin && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">You are already an admin!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    You have full access to all platform features and the admin panel.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Admin Setup Form */}
          <form onSubmit={setupAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="Enter email address to make admin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-mono"
              />
              <p className="text-sm text-gray-600">This user must have already signed up for an account.</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up Admin...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Setup Admin User
                </>
              )}
            </Button>
          </form>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Setup Instructions:
            </h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Make sure the user has already signed up for an account</li>
              <li>Enter their email address in the form above</li>
              <li>Click "Setup Admin User" to grant admin privileges</li>
              <li>The user will immediately have access to all features and the admin panel</li>
              <li>
                Admin users can access the admin dashboard at <code className="bg-blue-100 px-1 rounded">/admin</code>
              </li>
            </ol>
          </div>

          {/* Admin Features */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Admin Features Include:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-purple-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                User Management
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Content Moderation
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Analytics Dashboard
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                System Monitoring
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Payment Management
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Platform Settings
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
