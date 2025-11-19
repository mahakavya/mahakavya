"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Brain,
  Shield,
  Bot,
  Server,
  Lock,
  Globe,
  Mail,
  Bell,
  Zap,
  Activity,
  AlertTriangle,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PlatformSettings {
  general: {
    platformName: string
    description: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    maxUsersPerDay: number
    defaultLanguage: string
    timezone: string
  }
  ai: {
    enabled: boolean
    provider: string
    apiKey: string
    model: string
    maxTokens: number
    temperature: number
    contentModerationEnabled: boolean
    autoTranslationEnabled: boolean
    sentimentAnalysisEnabled: boolean
  }
  blockchain: {
    enabled: boolean
    network: string
    contractAddress: string
    privateKey: string
    gasLimit: number
    verificationEnabled: boolean
    auditTrailEnabled: boolean
  }
  rpa: {
    enabled: boolean
    maxConcurrentJobs: number
    jobTimeout: number
    retryAttempts: number
    schedulerEnabled: boolean
    monitoringEnabled: boolean
  }
  security: {
    twoFactorRequired: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    encryptionEnabled: boolean
    auditLogsEnabled: boolean
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    webhookUrl: string
    slackWebhook: string
  }
  performance: {
    cacheEnabled: boolean
    cacheTtl: number
    rateLimitEnabled: boolean
    maxRequestsPerMinute: number
    compressionEnabled: boolean
  }
}

export default function NiyantranaSetting() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [showSecrets, setShowSecrets] = useState(false)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
    loadSystemStatus()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSystemStatus = async () => {
    try {
      const response = await fetch("/api/admin/settings/status")
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error("Failed to load system status:", error)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully",
        })
        await loadSystemStatus() // Refresh status after save
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (service: string) => {
    try {
      const response = await fetch(`/api/admin/settings/test/${service}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      const result = await response.json()

      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to test ${service} connection`,
        variant: "destructive",
      })
    }
  }

  const exportSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/export")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `niyantrana-settings-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export settings",
        variant: "destructive",
      })
    }
  }

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedSettings = JSON.parse(text)
      setSettings(importedSettings)

      toast({
        title: "Success",
        description: "Settings imported successfully. Don't forget to save!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import settings. Invalid file format.",
        variant: "destructive",
      })
    }
  }

  const updateSetting = (category: keyof PlatformSettings, key: string, value: any) => {
    if (!settings) return

    setSettings((prev) => ({
      ...prev!,
      [category]: {
        ...prev![category],
        [key]: value,
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Failed to load platform settings. Please try refreshing the page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Niyantrana Setup
          </h1>
          <p className="text-muted-foreground mt-1">Platform-wide configurations and system settings</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.database ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.ai ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">AI Services</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.blockchain ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">Blockchain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${systemStatus.rpa ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">RPA Engine</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="rpa">RPA</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Platform Settings
              </CardTitle>
              <CardDescription>Basic platform configuration and global settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.general.platformName}
                    onChange={(e) => updateSetting("general", "platformName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={settings.general.defaultLanguage}
                    onValueChange={(value) => updateSetting("general", "defaultLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="bn">Bengali</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Platform Description</Label>
                <Textarea
                  id="description"
                  value={settings.general.description}
                  onChange={(e) => updateSetting("general", "description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsersPerDay">Max New Users Per Day</Label>
                  <Input
                    id="maxUsersPerDay"
                    type="number"
                    value={settings.general.maxUsersPerDay}
                    onChange={(e) => updateSetting("general", "maxUsersPerDay", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting("general", "timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable platform access for maintenance</p>
                </div>
                <Switch
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("general", "maintenanceMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registration Enabled</Label>
                  <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                </div>
                <Switch
                  checked={settings.general.registrationEnabled}
                  onCheckedChange={(checked) => updateSetting("general", "registrationEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>Configure AI services, models, and automation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Services Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable AI-powered features across the platform</p>
                </div>
                <Switch
                  checked={settings.ai.enabled}
                  onCheckedChange={(checked) => updateSetting("ai", "enabled", checked)}
                />
              </div>

              {settings.ai.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiProvider">AI Provider</Label>
                      <Select
                        value={settings.ai.provider}
                        onValueChange={(value) => updateSetting("ai", "provider", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google AI</SelectItem>
                          <SelectItem value="azure">Azure OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aiModel">AI Model</Label>
                      <Select value={settings.ai.model} onValueChange={(value) => updateSetting("ai", "model", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="claude-3">Claude 3</SelectItem>
                          <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiApiKey">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="aiApiKey"
                        type={showSecrets ? "text" : "password"}
                        value={settings.ai.apiKey}
                        onChange={(e) => updateSetting("ai", "apiKey", e.target.value)}
                        placeholder="Enter your AI provider API key"
                      />
                      <Button variant="outline" size="icon" onClick={() => setShowSecrets(!showSecrets)}>
                        {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={settings.ai.maxTokens}
                        onChange={(e) => updateSetting("ai", "maxTokens", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={settings.ai.temperature}
                        onChange={(e) => updateSetting("ai", "temperature", Number.parseFloat(e.target.value))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Content Moderation</Label>
                        <p className="text-sm text-muted-foreground">AI-powered content moderation and filtering</p>
                      </div>
                      <Switch
                        checked={settings.ai.contentModerationEnabled}
                        onCheckedChange={(checked) => updateSetting("ai", "contentModerationEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Translation</Label>
                        <p className="text-sm text-muted-foreground">Automatic content translation between languages</p>
                      </div>
                      <Switch
                        checked={settings.ai.autoTranslationEnabled}
                        onCheckedChange={(checked) => updateSetting("ai", "autoTranslationEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sentiment Analysis</Label>
                        <p className="text-sm text-muted-foreground">Real-time sentiment analysis of user content</p>
                      </div>
                      <Switch
                        checked={settings.ai.sentimentAnalysisEnabled}
                        onCheckedChange={(checked) => updateSetting("ai", "sentimentAnalysisEnabled", checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => testConnection("ai")} variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Test AI Connection
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blockchain Settings */}
        <TabsContent value="blockchain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Configuration
              </CardTitle>
              <CardDescription>Configure blockchain integration for security and verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Blockchain Integration</Label>
                  <p className="text-sm text-muted-foreground">Enable blockchain-based verification and audit trails</p>
                </div>
                <Switch
                  checked={settings.blockchain.enabled}
                  onCheckedChange={(checked) => updateSetting("blockchain", "enabled", checked)}
                />
              </div>

              {settings.blockchain.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="network">Blockchain Network</Label>
                      <Select
                        value={settings.blockchain.network}
                        onValueChange={(value) => updateSetting("blockchain", "network", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum Mainnet</SelectItem>
                          <SelectItem value="polygon">Polygon</SelectItem>
                          <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                          <SelectItem value="testnet">Ethereum Testnet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gasLimit">Gas Limit</Label>
                      <Input
                        id="gasLimit"
                        type="number"
                        value={settings.blockchain.gasLimit}
                        onChange={(e) => updateSetting("blockchain", "gasLimit", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractAddress">Smart Contract Address</Label>
                    <Input
                      id="contractAddress"
                      value={settings.blockchain.contractAddress}
                      onChange={(e) => updateSetting("blockchain", "contractAddress", e.target.value)}
                      placeholder="0x..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Private Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="privateKey"
                        type={showSecrets ? "text" : "password"}
                        value={settings.blockchain.privateKey}
                        onChange={(e) => updateSetting("blockchain", "privateKey", e.target.value)}
                        placeholder="Enter private key for blockchain transactions"
                      />
                      <Button variant="outline" size="icon" onClick={() => setShowSecrets(!showSecrets)}>
                        {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Content Verification</Label>
                        <p className="text-sm text-muted-foreground">Verify content integrity using blockchain</p>
                      </div>
                      <Switch
                        checked={settings.blockchain.verificationEnabled}
                        onCheckedChange={(checked) => updateSetting("blockchain", "verificationEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Audit Trail</Label>
                        <p className="text-sm text-muted-foreground">Store audit logs on blockchain for immutability</p>
                      </div>
                      <Switch
                        checked={settings.blockchain.auditTrailEnabled}
                        onCheckedChange={(checked) => updateSetting("blockchain", "auditTrailEnabled", checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => testConnection("blockchain")} variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Test Blockchain Connection
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RPA Settings */}
        <TabsContent value="rpa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                RPA Configuration
              </CardTitle>
              <CardDescription>Configure Robotic Process Automation settings and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>RPA Engine</Label>
                  <p className="text-sm text-muted-foreground">Enable automated process execution and monitoring</p>
                </div>
                <Switch
                  checked={settings.rpa.enabled}
                  onCheckedChange={(checked) => updateSetting("rpa", "enabled", checked)}
                />
              </div>

              {settings.rpa.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxConcurrentJobs">Max Concurrent Jobs</Label>
                      <Input
                        id="maxConcurrentJobs"
                        type="number"
                        value={settings.rpa.maxConcurrentJobs}
                        onChange={(e) => updateSetting("rpa", "maxConcurrentJobs", Number.parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTimeout">Job Timeout (minutes)</Label>
                      <Input
                        id="jobTimeout"
                        type="number"
                        value={settings.rpa.jobTimeout}
                        onChange={(e) => updateSetting("rpa", "jobTimeout", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retryAttempts">Retry Attempts</Label>
                    <Input
                      id="retryAttempts"
                      type="number"
                      value={settings.rpa.retryAttempts}
                      onChange={(e) => updateSetting("rpa", "retryAttempts", Number.parseInt(e.target.value))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Job Scheduler</Label>
                        <p className="text-sm text-muted-foreground">Enable scheduled automation jobs</p>
                      </div>
                      <Switch
                        checked={settings.rpa.schedulerEnabled}
                        onCheckedChange={(checked) => updateSetting("rpa", "schedulerEnabled", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Performance Monitoring</Label>
                        <p className="text-sm text-muted-foreground">Monitor RPA job performance and metrics</p>
                      </div>
                      <Switch
                        checked={settings.rpa.monitoringEnabled}
                        onCheckedChange={(checked) => updateSetting("rpa", "monitoringEnabled", checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => testConnection("rpa")} variant="outline">
                      <Bot className="h-4 w-4 mr-2" />
                      Test RPA Engine
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>Configure security policies and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting("security", "sessionTimeout", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting("security", "maxLoginAttempts", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSetting("security", "passwordMinLength", Number.parseInt(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication Required</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => updateSetting("security", "twoFactorRequired", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-muted-foreground">Enable end-to-end encryption for sensitive data</p>
                  </div>
                  <Switch
                    checked={settings.security.encryptionEnabled}
                    onCheckedChange={(checked) => updateSetting("security", "encryptionEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">Log all administrative actions and changes</p>
                  </div>
                  <Switch
                    checked={settings.security.auditLogsEnabled}
                    onCheckedChange={(checked) => updateSetting("security", "auditLogsEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Configuration
              </CardTitle>
              <CardDescription>Configure notification channels and webhook integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateSetting("notifications", "emailEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) => updateSetting("notifications", "smsEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) => updateSetting("notifications", "pushEnabled", checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.notifications.webhookUrl}
                    onChange={(e) => updateSetting("notifications", "webhookUrl", e.target.value)}
                    placeholder="https://your-webhook-endpoint.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slackWebhook">Slack Webhook</Label>
                  <Input
                    id="slackWebhook"
                    value={settings.notifications.slackWebhook}
                    onChange={(e) => updateSetting("notifications", "slackWebhook", e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button onClick={() => testConnection("notifications")} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Test Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Performance Configuration
              </CardTitle>
              <CardDescription>Configure caching, rate limiting, and performance optimizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Caching Enabled</Label>
                  <p className="text-sm text-muted-foreground">Enable Redis caching for improved performance</p>
                </div>
                <Switch
                  checked={settings.performance.cacheEnabled}
                  onCheckedChange={(checked) => updateSetting("performance", "cacheEnabled", checked)}
                />
              </div>

              {settings.performance.cacheEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="cacheTtl">Cache TTL (seconds)</Label>
                  <Input
                    id="cacheTtl"
                    type="number"
                    value={settings.performance.cacheTtl}
                    onChange={(e) => updateSetting("performance", "cacheTtl", Number.parseInt(e.target.value))}
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">Enable API rate limiting protection</p>
                </div>
                <Switch
                  checked={settings.performance.rateLimitEnabled}
                  onCheckedChange={(checked) => updateSetting("performance", "rateLimitEnabled", checked)}
                />
              </div>

              {settings.performance.rateLimitEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="maxRequestsPerMinute">Max Requests Per Minute</Label>
                  <Input
                    id="maxRequestsPerMinute"
                    type="number"
                    value={settings.performance.maxRequestsPerMinute}
                    onChange={(e) =>
                      updateSetting("performance", "maxRequestsPerMinute", Number.parseInt(e.target.value))
                    }
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Response Compression</Label>
                  <p className="text-sm text-muted-foreground">Enable gzip compression for API responses</p>
                </div>
                <Switch
                  checked={settings.performance.compressionEnabled}
                  onCheckedChange={(checked) => updateSetting("performance", "compressionEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
