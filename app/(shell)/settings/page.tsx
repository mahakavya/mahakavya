"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Settings,
  Palette,
  Globe,
  Shield,
  Bell,
  User,
  Lock,
  Eye,
  Smartphone,
  Mail,
  MessageSquare,
  Heart,
  Star,
  Zap,
  Brain,
  Link,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserSettings {
  id: string
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    marketing: boolean
    security: boolean
    social: boolean
  }
  privacy: {
    profileVisibility: "public" | "friends" | "private"
    showEmail: boolean
    showPhone: boolean
    allowMessages: boolean
    allowFriendRequests: boolean
    dataCollection: boolean
    analytics: boolean
  }
  preferences: {
    autoPlay: boolean
    highContrast: boolean
    reducedMotion: boolean
    compactMode: boolean
    showTips: boolean
    aiSuggestions: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    loginAlerts: boolean
    deviceTracking: boolean
  }
  ai: {
    personalizedContent: boolean
    smartNotifications: boolean
    contentModeration: boolean
    languageProcessing: boolean
    behaviorAnalysis: boolean
  }
  blockchain: {
    profileVerification: boolean
    contentSigning: boolean
    privacyMode: boolean
    auditTrail: boolean
  }
  rpa: {
    autoOptimization: boolean
    smartScheduling: boolean
    performanceMonitoring: boolean
    securityScanning: boolean
  }
}

interface AIInsights {
  usagePatterns: {
    mostActiveTime: string
    preferredContent: string[]
    engagementScore: number
  }
  recommendations: {
    theme: string
    notifications: string[]
    privacy: string[]
  }
  securityScore: number
  optimizationSuggestions: string[]
}

interface BlockchainStatus {
  profileVerified: boolean
  settingsIntegrity: boolean
  lastAudit: string
  verificationLevel: "basic" | "enhanced" | "premium"
}

interface RPAStatus {
  activeJobs: number
  lastOptimization: string
  performanceScore: number
  securityAlerts: number
}

export default function SthapanaPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null)
  const [rpaStatus, setRpaStatus] = useState<RPAStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadUserSettings()
    loadAIInsights()
    loadBlockchainStatus()
    loadRPAStatus()
  }, [])

  const loadUserSettings = async () => {
    try {
      const response = await fetch("/api/settings/user")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAIInsights = async () => {
    try {
      const response = await fetch("/api/settings/ai-insights")
      if (response.ok) {
        const data = await response.json()
        setAiInsights(data.insights)
      }
    } catch (error) {
      console.error("Error loading AI insights:", error)
    }
  }

  const loadBlockchainStatus = async () => {
    try {
      const response = await fetch("/api/settings/blockchain-status")
      if (response.ok) {
        const data = await response.json()
        setBlockchainStatus(data.status)
      }
    } catch (error) {
      console.error("Error loading blockchain status:", error)
    }
  }

  const loadRPAStatus = async () => {
    try {
      const response = await fetch("/api/settings/rpa-status")
      if (response.ok) {
        const data = await response.json()
        setRpaStatus(data.status)
      }
    } catch (error) {
      console.error("Error loading RPA status:", error)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/settings/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        })

        // Trigger RPA optimization
        await fetch("/api/rpa/optimize-settings", { method: "POST" })

        // Update blockchain audit trail
        await fetch("/api/blockchain/log-settings-change", { method: "POST" })

        // Refresh insights
        loadAIInsights()
        loadRPAStatus()
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      const response = await fetch("/api/settings/reset", { method: "POST" })
      if (response.ok) {
        await loadUserSettings()
        toast({
          title: "Settings Reset",
          description: "All settings have been reset to defaults.",
        })
      }
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({
        title: "Error",
        description: "Failed to reset settings.",
        variant: "destructive",
      })
    }
  }

  const exportSettings = async () => {
    try {
      const response = await fetch("/api/settings/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "mahakavya-settings.json"
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Settings Exported",
          description: "Your settings have been downloaded successfully.",
        })
      }
    } catch (error) {
      console.error("Error exporting settings:", error)
      toast({
        title: "Error",
        description: "Failed to export settings.",
        variant: "destructive",
      })
    }
  }

  const importSettings = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/settings/import", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        await loadUserSettings()
        toast({
          title: "Settings Imported",
          description: "Your settings have been imported successfully.",
        })
      }
    } catch (error) {
      console.error("Error importing settings:", error)
      toast({
        title: "Error",
        description: "Failed to import settings.",
        variant: "destructive",
      })
    }
  }

  const enableTwoFactor = async () => {
    try {
      const response = await fetch("/api/security/2fa/enable", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        // Show QR code modal or redirect to 2FA setup
        router.push("/settings/2fa-setup")
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication.",
        variant: "destructive",
      })
    }
  }

  const verifyBlockchainProfile = async () => {
    try {
      const response = await fetch("/api/blockchain/verify-profile", { method: "POST" })
      if (response.ok) {
        await loadBlockchainStatus()
        toast({
          title: "Verification Initiated",
          description: "Blockchain profile verification has been started.",
        })
      }
    } catch (error) {
      console.error("Error verifying profile:", error)
      toast({
        title: "Error",
        description: "Failed to initiate blockchain verification.",
        variant: "destructive",
      })
    }
  }

  const optimizeWithRPA = async () => {
    try {
      const response = await fetch("/api/rpa/optimize-all", { method: "POST" })
      if (response.ok) {
        await loadRPAStatus()
        toast({
          title: "Optimization Started",
          description: "RPA optimization process has been initiated.",
        })
      }
    } catch (error) {
      console.error("Error starting RPA optimization:", error)
      toast({
        title: "Error",
        description: "Failed to start RPA optimization.",
        variant: "destructive",
      })
    }
  }

  if (loading || !settings) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">स्थापना (Sthapana) - Settings</h1>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">स्थापना (Sthapana) - Settings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importSettings(e.target.files[0])}
          />
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      {aiInsights && (
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                AI Analysis: Your engagement score is {aiInsights.usagePatterns.engagementScore}%. Most active during{" "}
                {aiInsights.usagePatterns.mostActiveTime}.
              </span>
              <Badge variant="secondary">Security Score: {aiInsights.securityScore}%</Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Configure your language preferences and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      <SelectItem value="sa">संस्कृत (Sanskrit)</SelectItem>
                      <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                      <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                      <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                      <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your platform experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-play videos</Label>
                  <p className="text-sm text-muted-foreground">Automatically play videos in your feed</p>
                </div>
                <Switch
                  checked={settings.preferences.autoPlay}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, autoPlay: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show helpful tips</Label>
                  <p className="text-sm text-muted-foreground">Display contextual tips and guidance</p>
                </div>
                <Switch
                  checked={settings.preferences.showTips}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, showTips: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact mode</Label>
                  <p className="text-sm text-muted-foreground">Use a more compact layout to show more content</p>
                </div>
                <Switch
                  checked={settings.preferences.compactMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, compactMode: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Display
              </CardTitle>
              <CardDescription>Customize the visual appearance of the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(["light", "dark", "system"] as const).map((theme) => (
                    <div
                      key={theme}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        settings.theme === theme ? "border-primary bg-primary/5" : "border-border"
                      }`}
                      onClick={() => setSettings({ ...settings, theme })}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {theme === "light" && <div className="w-8 h-8 bg-white border rounded" />}
                        {theme === "dark" && <div className="w-8 h-8 bg-gray-900 border rounded" />}
                        {theme === "system" && (
                          <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-900 border rounded" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-center capitalize">{theme}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={settings.preferences.highContrast}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, highContrast: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduced motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                </div>
                <Switch
                  checked={settings.preferences.reducedMotion}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      preferences: { ...settings.preferences, reducedMotion: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Profile Privacy
              </CardTitle>
              <CardDescription>Control who can see your profile and information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Profile visibility</Label>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value: "public" | "friends" | "private") =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, profileVisibility: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                    <SelectItem value="friends">Friends - Only friends can see your profile</SelectItem>
                    <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show email address</Label>
                  <p className="text-sm text-muted-foreground">Display your email on your public profile</p>
                </div>
                <Switch
                  checked={settings.privacy.showEmail}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, showEmail: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow messages from anyone</Label>
                  <p className="text-sm text-muted-foreground">Let anyone send you direct messages</p>
                </div>
                <Switch
                  checked={settings.privacy.allowMessages}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, allowMessages: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data collection for analytics</Label>
                  <p className="text-sm text-muted-foreground">Allow anonymous usage data collection</p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, analytics: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Privacy */}
          {blockchainStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Blockchain Privacy
                  {blockchainStatus.profileVerified && (
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Blockchain-secured privacy controls and verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile verification</Label>
                    <p className="text-sm text-muted-foreground">Verify your identity using blockchain technology</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.blockchain.profileVerification}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          blockchain: { ...settings.blockchain, profileVerification: checked },
                        })
                      }
                    />
                    {!blockchainStatus.profileVerified && (
                      <Button size="sm" onClick={verifyBlockchainProfile}>
                        Verify Now
                      </Button>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Content signing</Label>
                    <p className="text-sm text-muted-foreground">Cryptographically sign your posts and content</p>
                  </div>
                  <Switch
                    checked={settings.blockchain.contentSigning}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        blockchain: { ...settings.blockchain, contentSigning: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Privacy mode</Label>
                    <p className="text-sm text-muted-foreground">Enhanced privacy with zero-knowledge proofs</p>
                  </div>
                  <Switch
                    checked={settings.blockchain.privacyMode}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        blockchain: { ...settings.blockchain, privacyMode: checked },
                      })
                    }
                  />
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Verification Level:</span>
                    <Badge
                      variant={
                        blockchainStatus.verificationLevel === "premium"
                          ? "default"
                          : blockchainStatus.verificationLevel === "enhanced"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {blockchainStatus.verificationLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span>Last Audit:</span>
                    <span className="text-muted-foreground">{blockchainStatus.lastAudit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how and when you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Push notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications on your devices</p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, push: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    SMS notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive important notifications via SMS</p>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, sms: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Social notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Likes, comments, follows, and mentions</p>
                </div>
                <Switch
                  checked={settings.notifications.social}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, social: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Login alerts and security updates</p>
                </div>
                <Switch
                  checked={settings.notifications.security}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, security: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Smart Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Smart Notifications
                <Badge variant="secondary">AI-Powered</Badge>
              </CardTitle>
              <CardDescription>AI-optimized notification timing and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Smart notification timing</Label>
                  <p className="text-sm text-muted-foreground">AI determines the best time to send notifications</p>
                </div>
                <Switch
                  checked={settings.ai.smartNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, smartNotifications: checked },
                    })
                  }
                />
              </div>
              {aiInsights && settings.ai.smartNotifications && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">AI Recommendations:</h4>
                  <ul className="text-sm space-y-1">
                    {aiInsights.recommendations.notifications.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>Protect your account with advanced security features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-factor authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      if (checked && !settings.security.twoFactorEnabled) {
                        enableTwoFactor()
                      } else {
                        setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorEnabled: checked },
                        })
                      }
                    }}
                  />
                  {settings.security.twoFactorEnabled && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Session timeout (minutes)</Label>
                <Select
                  value={settings.security.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: Number.parseInt(value) },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                </div>
                <Switch
                  checked={settings.security.loginAlerts}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, loginAlerts: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Device tracking</Label>
                  <p className="text-sm text-muted-foreground">Track and manage your active devices</p>
                </div>
                <Switch
                  checked={settings.security.deviceTracking}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      security: { ...settings.security, deviceTracking: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Score */}
          {aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Score
                  <Badge variant={aiInsights.securityScore >= 80 ? "default" : "destructive"}>
                    {aiInsights.securityScore}%
                  </Badge>
                </CardTitle>
                <CardDescription>AI-powered security assessment of your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={aiInsights.securityScore} className="w-full" />
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations:</h4>
                  {aiInsights.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Features
              </CardTitle>
              <CardDescription>Configure AI-powered features and personalization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Personalized content</Label>
                  <p className="text-sm text-muted-foreground">AI curates content based on your interests</p>
                </div>
                <Switch
                  checked={settings.ai.personalizedContent}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, personalizedContent: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Content moderation</Label>
                  <p className="text-sm text-muted-foreground">AI helps filter inappropriate content</p>
                </div>
                <Switch
                  checked={settings.ai.contentModeration}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, contentModeration: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Language processing</Label>
                  <p className="text-sm text-muted-foreground">AI assists with translation and language support</p>
                </div>
                <Switch
                  checked={settings.ai.languageProcessing}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, languageProcessing: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Behavior analysis</Label>
                  <p className="text-sm text-muted-foreground">AI analyzes usage patterns for optimization</p>
                </div>
                <Switch
                  checked={settings.ai.behaviorAnalysis}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      ai: { ...settings.ai, behaviorAnalysis: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          {aiInsights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Your AI Insights
                </CardTitle>
                <CardDescription>Personalized insights based on your activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1">Most Active Time</h4>
                    <p className="text-sm text-muted-foreground">{aiInsights.usagePatterns.mostActiveTime}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-1">Engagement Score</h4>
                    <p className="text-sm text-muted-foreground">{aiInsights.usagePatterns.engagementScore}%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Preferred Content Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiInsights.usagePatterns.preferredContent.map((content, index) => (
                      <Badge key={index} variant="outline">
                        {content}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">AI Recommendations:</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Theme: {aiInsights.recommendations.theme}
                    </li>
                    {aiInsights.recommendations.privacy.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Info className="h-3 w-3 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          {/* RPA Settings */}
          {rpaStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  RPA Automation
                  <Badge variant="secondary">{rpaStatus.activeJobs} Active Jobs</Badge>
                </CardTitle>
                <CardDescription>Robotic Process Automation for enhanced user experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-optimization</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically optimize your settings and preferences
                    </p>
                  </div>
                  <Switch
                    checked={settings.rpa.autoOptimization}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        rpa: { ...settings.rpa, autoOptimization: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Smart scheduling</Label>
                    <p className="text-sm text-muted-foreground">AI-powered scheduling for posts and activities</p>
                  </div>
                  <Switch
                    checked={settings.rpa.smartScheduling}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        rpa: { ...settings.rpa, smartScheduling: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance monitoring</Label>
                    <p className="text-sm text-muted-foreground">Continuous monitoring and performance optimization</p>
                  </div>
                  <Switch
                    checked={settings.rpa.performanceMonitoring}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        rpa: { ...settings.rpa, performanceMonitoring: checked },
                      })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security scanning</Label>
                    <p className="text-sm text-muted-foreground">Automated security scans and threat detection</p>
                  </div>
                  <Switch
                    checked={settings.rpa.securityScanning}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        rpa: { ...settings.rpa, securityScanning: checked },
                      })
                    }
                  />
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Performance Score:</span>
                    <Badge variant="secondary">{rpaStatus.performanceScore}%</Badge>
                  </div>
                  <Progress value={rpaStatus.performanceScore} className="w-full mb-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span>Last Optimization:</span>
                    <span className="text-muted-foreground">{rpaStatus.lastOptimization}</span>
                  </div>
                  {rpaStatus.securityAlerts > 0 && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span>Security Alerts:</span>
                      <Badge variant="destructive">{rpaStatus.securityAlerts}</Badge>
                    </div>
                  )}
                </div>
                <Button onClick={optimizeWithRPA} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Full Optimization
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your data, exports, and account deletion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={exportSettings}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" onClick={() => router.push("/settings/data-request")}>
                  <Copy className="h-4 w-4 mr-2" />
                  Request Data Copy
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-destructive">Danger Zone</Label>
                <div className="p-4 border border-destructive rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-destructive">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" onClick={() => router.push("/settings/delete-account")}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Platform version and system details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Platform Version</Label>
                  <p className="text-muted-foreground">Mahakavya v2.1.0</p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-muted-foreground">2024-01-15</p>
                </div>
                <div>
                  <Label>User ID</Label>
                  <p className="text-muted-foreground font-mono">{settings.id}</p>
                </div>
                <div>
                  <Label>Account Type</Label>
                  <p className="text-muted-foreground">Premium</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.open("/help", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Help Center
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open("/privacy", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Privacy Policy
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open("/terms", "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Terms of Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Reset Settings
              </CardTitle>
              <CardDescription>Reset all settings to their default values</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. All your customized settings will be lost.
                </AlertDescription>
              </Alert>
              <Button variant="outline" onClick={resetToDefaults} className="mt-4 bg-transparent">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
