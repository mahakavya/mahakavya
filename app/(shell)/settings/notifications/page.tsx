"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Brain, Shield, Zap, Smartphone, Mail, MessageSquare } from "lucide-react"

interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  inApp: boolean
  posts: boolean
  comments: boolean
  likes: boolean
  follows: boolean
  campaigns: boolean
  messages: boolean
}

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    sms: false,
    inApp: true,
    posts: true,
    comments: true,
    likes: false,
    follows: true,
    campaigns: true,
    messages: true,
  })

  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [personalizing, setPersonalizing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [automating, setAutomating] = useState(false)

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const personalizePreferences = async () => {
    setPersonalizing(true)
    // Simulate AI personalization
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // AI suggests optimal settings based on user behavior
    const personalizedPrefs: NotificationPreferences = {
      ...preferences,
      email: true, // AI recommends email for important updates
      push: true, // AI recommends push for real-time engagement
      sms: false, // AI suggests SMS only for critical alerts
      likes: false, // AI suggests reducing noise from likes
      comments: true, // AI recommends comments for engagement
    }

    setPreferences(personalizedPrefs)
    setPersonalizing(false)
  }

  const verifyPreferences = async () => {
    setVerifying(true)
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const isVerified = Math.random() > 0.1 // 90% success rate

    if (isVerified) {
      setResult(`✅ Preferences verified on blockchain!

🔗 **Blockchain Record:**
Transaction Hash: 0x${Math.random().toString(16).substr(2, 8)}
Block Number: ${Math.floor(Math.random() * 1000000)}
Verification Status: Confirmed

📋 **Verified Settings:**
Email: ${preferences.email ? "Enabled" : "Disabled"}
Push: ${preferences.push ? "Enabled" : "Disabled"}
SMS: ${preferences.sms ? "Enabled" : "Disabled"}
In-App: ${preferences.inApp ? "Enabled" : "Disabled"}`)
    } else {
      setResult("❌ Blockchain verification failed")
    }

    setVerifying(false)
  }

  const automateDelivery = async () => {
    setAutomating(true)
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 1800))

    setResult(`⚡ RPA Automation configured successfully!

🤖 **Automated Processes:**
• Smart delivery timing optimization
• Cross-platform synchronization
• Duplicate notification prevention
• Engagement-based frequency adjustment

📊 **Delivery Metrics:**
• Email delivery rate: 98.5%
• Push notification reach: 94.2%
• SMS delivery success: 99.1%
• In-app notification views: 87.3%

🎯 **Optimization Features:**
• Peak engagement time detection
• Content relevance scoring
• User preference learning
• Spam prevention algorithms`)

    setAutomating(false)
  }

  const savePreferences = async () => {
    setProcessing(true)
    setResult(null)

    try {
      // Simulate saving preferences
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setResult(`✅ Notification preferences saved successfully!

📱 **Active Channels:**
${preferences.email ? "• Email notifications" : ""}
${preferences.push ? "• Push notifications" : ""}
${preferences.sms ? "• SMS notifications" : ""}
${preferences.inApp ? "• In-app notifications" : ""}

🔔 **Content Types:**
${preferences.posts ? "• New posts" : ""}
${preferences.comments ? "• Comments" : ""}
${preferences.likes ? "• Likes" : ""}
${preferences.follows ? "• New followers" : ""}
${preferences.campaigns ? "• Campaign updates" : ""}
${preferences.messages ? "• Direct messages" : ""}`)
    } catch (error) {
      setResult("❌ Failed to save preferences")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
          <p className="text-gray-600">AI-personalized notifications with blockchain verification and RPA automation</p>
        </div>

        {/* AI Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Notification Tools
            </CardTitle>
            <CardDescription>Optimize your notification experience with AI, blockchain, and RPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={personalizePreferences} disabled={personalizing} variant="outline">
                {personalizing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Personalizing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    AI Personalize
                  </>
                )}
              </Button>

              <Button onClick={verifyPreferences} disabled={verifying} variant="outline">
                {verifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Settings
                  </>
                )}
              </Button>

              <Button onClick={automateDelivery} disabled={automating} variant="outline">
                {automating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Automating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Automate Delivery
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>Choose how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-blue-600" />
                <Label htmlFor="email">Email Notifications</Label>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) => updatePreference("email", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-green-600" />
                <Label htmlFor="push">Push Notifications</Label>
              </div>
              <Switch
                id="push"
                checked={preferences.push}
                onCheckedChange={(checked) => updatePreference("push", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                <Label htmlFor="sms">SMS Notifications</Label>
              </div>
              <Switch
                id="sms"
                checked={preferences.sms}
                onCheckedChange={(checked) => updatePreference("sms", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-orange-600" />
                <Label htmlFor="inApp">In-App Notifications</Label>
              </div>
              <Switch
                id="inApp"
                checked={preferences.inApp}
                onCheckedChange={(checked) => updatePreference("inApp", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Content</CardTitle>
            <CardDescription>Select what types of activities you want to be notified about</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="posts">New Posts from Following</Label>
              <Switch
                id="posts"
                checked={preferences.posts}
                onCheckedChange={(checked) => updatePreference("posts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="comments">Comments on Your Posts</Label>
              <Switch
                id="comments"
                checked={preferences.comments}
                onCheckedChange={(checked) => updatePreference("comments", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="likes">Likes on Your Posts</Label>
              <Switch
                id="likes"
                checked={preferences.likes}
                onCheckedChange={(checked) => updatePreference("likes", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="follows">New Followers</Label>
              <Switch
                id="follows"
                checked={preferences.follows}
                onCheckedChange={(checked) => updatePreference("follows", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="campaigns">Campaign Updates</Label>
              <Switch
                id="campaigns"
                checked={preferences.campaigns}
                onCheckedChange={(checked) => updatePreference("campaigns", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="messages">Direct Messages</Label>
              <Switch
                id="messages"
                checked={preferences.messages}
                onCheckedChange={(checked) => updatePreference("messages", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={savePreferences} disabled={processing} className="w-full">
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving Preferences...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Save Notification Preferences
            </>
          )}
        </Button>

        {/* Results */}
        {result && (
          <Alert>
            <AlertDescription className="whitespace-pre-line">{result}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
