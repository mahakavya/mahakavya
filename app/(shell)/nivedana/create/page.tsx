"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/money"
import {
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Bot,
  Camera,
  FileText,
  Target,
  Zap,
  Brain,
  Lock,
} from "lucide-react"
import Image from "next/image"

interface CampaignData {
  title: string
  description: string
  category: string
  goalAmount: string
  endDate: string
  beneficiaryName: string
  beneficiaryContact: string
  coverImage?: File
  coverUrl?: string
  documents: File[]
  tags: string[]
  aiOptimized: boolean
  blockchainVerified: boolean
  rpaEnabled: boolean
}

const categories = [
  "Medical Emergency",
  "Education",
  "Disaster Relief",
  "Community Development",
  "Animal Welfare",
  "Environmental",
  "Sports & Recreation",
  "Arts & Culture",
  "Technology",
  "Other",
]

const steps = [
  { id: 1, title: "Basic Info", description: "Campaign details", icon: FileText },
  { id: 2, title: "Media & Docs", description: "Images and documents", icon: Camera },
  { id: 3, title: "AI Enhancement", description: "AI optimization", icon: Brain },
  { id: 4, title: "Blockchain", description: "Security verification", icon: Lock },
  { id: 5, title: "Review", description: "Final review", icon: Check },
]

export default function NivedanaNirmanaPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [blockchainStatus, setBlockchainStatus] = useState<any>(null)
  const [rpaMetrics, setRpaMetrics] = useState<any>(null)
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: "",
    description: "",
    category: "",
    goalAmount: "",
    endDate: "",
    beneficiaryName: "",
    beneficiaryContact: "",
    documents: [],
    tags: [],
    aiOptimized: false,
    blockchainVerified: false,
    rpaEnabled: false,
  })

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    checkSubscriptionStatus()
    loadAIInsights()
    loadBlockchainStatus()
    loadRPAMetrics()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/billing/subscription/status")
      const data = await response.json()
      setHasActiveSubscription(data.hasActiveSubscription)
    } catch (error) {
      console.error("Failed to check subscription:", error)
    }
  }

  const loadAIInsights = async () => {
    try {
      const response = await fetch("/api/fundraising/ai-insights")
      const data = await response.json()
      setAiInsights(data)
    } catch (error) {
      console.error("Failed to load AI insights:", error)
    }
  }

  const loadBlockchainStatus = async () => {
    try {
      const response = await fetch("/api/fundraising/blockchain-stats")
      const data = await response.json()
      setBlockchainStatus(data)
    } catch (error) {
      console.error("Failed to load blockchain status:", error)
    }
  }

  const loadRPAMetrics = async () => {
    try {
      const response = await fetch("/api/fundraising/rpa-metrics")
      const data = await response.json()
      setRpaMetrics(data)
    } catch (error) {
      console.error("Failed to load RPA metrics:", error)
    }
  }

  if (!hasActiveSubscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6 text-orange-500" />
              Premium Subscription Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Creating fundraising campaigns requires an active premium subscription to access advanced AI,
                Blockchain, and RPA features.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Brain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold">AI Enhancement</h3>
                  <p className="text-sm text-gray-600">Smart content optimization</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Blockchain Security</h3>
                  <p className="text-sm text-gray-600">Verified authenticity</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Bot className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold">RPA Automation</h3>
                  <p className="text-sm text-gray-600">Automated optimization</p>
                </CardContent>
              </Card>
            </div>
            <Button onClick={() => router.push("/billing")} className="w-full" size="lg">
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCoverUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "campaign_cover")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const result = await response.json()
      setCampaignData((prev) => ({
        ...prev,
        coverImage: file,
        coverUrl: result.url,
      }))

      toast({
        title: "Cover uploaded",
        description: "Campaign cover image uploaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload cover image.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDocumentUpload = async (files: FileList) => {
    setIsUploading(true)
    try {
      const uploadedDocs = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "campaign_document")

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          uploadedDocs.push(file)
        }
      }

      setCampaignData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...uploadedDocs],
      }))

      toast({
        title: "Documents uploaded",
        description: `${uploadedDocs.length} document(s) uploaded successfully.`,
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload documents.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAIOptimization = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fundraising/ai-optimize-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignData.title,
          description: campaignData.description,
          category: campaignData.category,
          goalAmount: campaignData.goalAmount,
        }),
      })

      if (!response.ok) throw new Error("AI optimization failed")

      const result = await response.json()
      setCampaignData((prev) => ({
        ...prev,
        title: result.optimizedTitle || prev.title,
        description: result.optimizedDescription || prev.description,
        tags: result.suggestedTags || prev.tags,
        aiOptimized: true,
      }))

      toast({
        title: "AI Optimization Complete",
        description: "Your campaign has been enhanced with AI suggestions.",
      })
    } catch (error) {
      toast({
        title: "AI optimization failed",
        description: error instanceof Error ? error.message : "Failed to optimize campaign.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlockchainVerification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fundraising/blockchain-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignData.title,
          goalAmount: campaignData.goalAmount,
          beneficiaryName: campaignData.beneficiaryName,
        }),
      })

      if (!response.ok) throw new Error("Blockchain verification failed")

      const result = await response.json()
      setCampaignData((prev) => ({
        ...prev,
        blockchainVerified: true,
      }))

      toast({
        title: "Blockchain Verification Complete",
        description: "Your campaign has been verified on the blockchain.",
      })
    } catch (error) {
      toast({
        title: "Blockchain verification failed",
        description: error instanceof Error ? error.message : "Failed to verify campaign.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRPASetup = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fundraising/rpa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignData,
        }),
      })

      if (!response.ok) throw new Error("RPA setup failed")

      setCampaignData((prev) => ({
        ...prev,
        rpaEnabled: true,
      }))

      toast({
        title: "RPA Automation Enabled",
        description: "Automated optimization has been configured for your campaign.",
      })
    } catch (error) {
      toast({
        title: "RPA setup failed",
        description: error instanceof Error ? error.message : "Failed to setup automation.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fundraising/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignData.title,
          description: campaignData.description,
          category: campaignData.category,
          goalAmount: Number.parseInt(campaignData.goalAmount),
          endDate: campaignData.endDate,
          coverUrl: campaignData.coverUrl,
          beneficiaryInfo: {
            name: campaignData.beneficiaryName,
            contact: campaignData.beneficiaryContact,
          },
          tags: campaignData.tags,
          aiOptimized: campaignData.aiOptimized,
          blockchainVerified: campaignData.blockchainVerified,
          rpaEnabled: campaignData.rpaEnabled,
        }),
      })

      if (!response.ok) throw new Error("Failed to create campaign")

      const campaign = await response.json()

      toast({
        title: "Campaign Created!",
        description: "Your fundraising campaign has been created successfully.",
      })

      router.push(`/nivedana/${campaign.id}`)
    } catch (error) {
      toast({
        title: "Failed to create campaign",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          campaignData.title.length >= 5 &&
          campaignData.description.length >= 50 &&
          campaignData.category &&
          campaignData.goalAmount &&
          campaignData.endDate &&
          campaignData.beneficiaryName
        )
      case 2:
        return campaignData.coverUrl
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const getStepProgress = () => {
    return (currentStep / steps.length) * 100
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Fundraising Campaign</h1>
          <p className="text-gray-600">
            Launch your campaign with AI-powered optimization, blockchain security, and automated management.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(getStepProgress())}% Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-center min-w-0">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                    ${currentStep >= step.id ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"}
                  `}
                >
                  {currentStep > step.id ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 mx-4 hidden sm:block" />}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Campaign Title *</Label>
                    <Input
                      id="title"
                      value={campaignData.title}
                      onChange={(e) => setCampaignData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a compelling campaign title"
                      maxLength={100}
                    />
                    <div className="text-xs text-gray-500 mt-1">{campaignData.title.length}/100 characters</div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={campaignData.category}
                      onValueChange={(value) => setCampaignData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Campaign Description *</Label>
                  <Textarea
                    id="description"
                    value={campaignData.description}
                    onChange={(e) => setCampaignData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your campaign, its purpose, and why people should support it..."
                    rows={6}
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {campaignData.description.length}/2000 characters (minimum 50)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="goalAmount">Funding Goal (₹) *</Label>
                    <Input
                      id="goalAmount"
                      type="number"
                      value={campaignData.goalAmount}
                      onChange={(e) => setCampaignData((prev) => ({ ...prev, goalAmount: e.target.value }))}
                      placeholder="100000"
                      min="1000"
                      max="100000000"
                    />
                    {campaignData.goalAmount && (
                      <div className="text-sm text-gray-600 mt-1">
                        Goal: {formatINR(Number.parseInt(campaignData.goalAmount) || 0)}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endDate">Campaign End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={campaignData.endDate}
                      onChange={(e) => setCampaignData((prev) => ({ ...prev, endDate: e.target.value }))}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="beneficiaryName">Beneficiary Name *</Label>
                    <Input
                      id="beneficiaryName"
                      value={campaignData.beneficiaryName}
                      onChange={(e) => setCampaignData((prev) => ({ ...prev, beneficiaryName: e.target.value }))}
                      placeholder="Who will benefit from this campaign?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="beneficiaryContact">Beneficiary Contact</Label>
                    <Input
                      id="beneficiaryContact"
                      value={campaignData.beneficiaryContact}
                      onChange={(e) => setCampaignData((prev) => ({ ...prev, beneficiaryContact: e.target.value }))}
                      placeholder="Phone or email (optional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <Label>Campaign Cover Image *</Label>
                  <div className="mt-2">
                    {campaignData.coverUrl ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={campaignData.coverUrl || "/placeholder.svg"}
                          alt="Campaign cover"
                          fill
                          className="object-cover"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            setCampaignData((prev) => ({ ...prev, coverUrl: undefined, coverImage: undefined }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="text-lg font-medium mb-2">Upload Campaign Cover</div>
                        <div className="text-sm text-gray-600 mb-4">
                          Choose a compelling image that represents your campaign
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleCoverUpload(file)
                          }}
                          className="hidden"
                          id="cover-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("cover-upload")?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? "Uploading..." : "Choose Image"}
                        </Button>
                        <div className="text-xs text-gray-500 mt-2">Maximum 10MB • JPG, PNG, WebP</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Supporting Documents</Label>
                  <div className="mt-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm font-medium mb-1">Upload Supporting Documents</div>
                      <div className="text-xs text-gray-600 mb-3">
                        Medical reports, certificates, or other relevant documents
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files) handleDocumentUpload(e.target.files)
                        }}
                        className="hidden"
                        id="docs-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("docs-upload")?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Choose Files"}
                      </Button>
                      <div className="text-xs text-gray-500 mt-2">Maximum 5MB per file</div>
                    </div>
                    {campaignData.documents.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Uploaded Documents:</div>
                        <div className="space-y-2">
                          {campaignData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{doc.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCampaignData((prev) => ({
                                    ...prev,
                                    documents: prev.documents.filter((_, i) => i !== index),
                                  }))
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Brain className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">AI Enhancement</h3>
                  <p className="text-gray-600">Let our AI optimize your campaign for maximum impact</p>
                </div>

                {aiInsights && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        AI Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{aiInsights.successRate}%</div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{aiInsights.avgDonation}</div>
                          <div className="text-sm text-gray-600">Avg Donation</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{aiInsights.optimizationScore}</div>
                          <div className="text-sm text-gray-600">AI Score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${campaignData.aiOptimized ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <div>
                      <div className="font-medium">AI Content Optimization</div>
                      <div className="text-sm text-gray-600">
                        {campaignData.aiOptimized
                          ? "Your campaign has been optimized with AI suggestions"
                          : "Enhance your campaign title, description, and tags with AI"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleAIOptimization}
                    disabled={isLoading || campaignData.aiOptimized}
                    variant={campaignData.aiOptimized ? "secondary" : "default"}
                  >
                    {isLoading ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : campaignData.aiOptimized ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Optimized
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Optimize with AI
                      </>
                    )}
                  </Button>
                </div>

                {campaignData.aiOptimized && (
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      AI optimization complete! Your campaign content has been enhanced for better engagement and
                      success rates.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Blockchain Security</h3>
                  <p className="text-gray-600">Secure your campaign with blockchain verification</p>
                </div>

                {blockchainStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-green-500" />
                        Blockchain Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{blockchainStatus.verifiedCampaigns}</div>
                          <div className="text-sm text-gray-600">Verified Campaigns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{blockchainStatus.securityScore}%</div>
                          <div className="text-sm text-gray-600">Security Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{blockchainStatus.trustLevel}</div>
                          <div className="text-sm text-gray-600">Trust Level</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${campaignData.blockchainVerified ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <div>
                      <div className="font-medium">Blockchain Verification</div>
                      <div className="text-sm text-gray-600">
                        {campaignData.blockchainVerified
                          ? "Your campaign is verified and secured on the blockchain"
                          : "Verify your campaign authenticity with blockchain technology"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleBlockchainVerification}
                    disabled={isLoading || campaignData.blockchainVerified}
                    variant={campaignData.blockchainVerified ? "secondary" : "default"}
                  >
                    {isLoading ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : campaignData.blockchainVerified ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Verify on Blockchain
                      </>
                    )}
                  </Button>
                </div>

                {rpaMetrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-500" />
                        RPA Automation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{rpaMetrics.automatedTasks}</div>
                          <div className="text-sm text-gray-600">Automated Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{rpaMetrics.efficiency}%</div>
                          <div className="text-sm text-gray-600">Efficiency Gain</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{rpaMetrics.timeSaved}h</div>
                          <div className="text-sm text-gray-600">Time Saved</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${campaignData.rpaEnabled ? "bg-green-500" : "bg-gray-300"}`}
                    />
                    <div>
                      <div className="font-medium">RPA Automation</div>
                      <div className="text-sm text-gray-600">
                        {campaignData.rpaEnabled
                          ? "Automated optimization and management is enabled"
                          : "Enable automated campaign optimization and management"}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleRPASetup}
                    disabled={isLoading || campaignData.rpaEnabled}
                    variant={campaignData.rpaEnabled ? "secondary" : "default"}
                  >
                    {isLoading ? (
                      <>
                        <Zap className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : campaignData.rpaEnabled ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        Enable RPA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Review Your Campaign</h3>
                  <p className="text-gray-600">Review all details before publishing your campaign</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Title</Label>
                        <p className="font-medium">{campaignData.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Category</Label>
                        <p className="font-medium">{campaignData.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Goal Amount</Label>
                        <p className="font-medium">{formatINR(Number.parseInt(campaignData.goalAmount) || 0)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">End Date</Label>
                        <p className="font-medium">{new Date(campaignData.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Beneficiary</Label>
                        <p className="font-medium">{campaignData.beneficiaryName}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-500">Description</Label>
                      <p className="text-sm text-gray-700 mt-1">{campaignData.description}</p>
                    </div>

                    {campaignData.coverUrl && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Cover Image</Label>
                        <div className="mt-2 aspect-video w-48 rounded-lg overflow-hidden">
                          <Image
                            src={campaignData.coverUrl || "/placeholder.svg"}
                            alt="Campaign cover"
                            width={192}
                            height={108}
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {campaignData.aiOptimized && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Optimized
                        </Badge>
                      )}
                      {campaignData.blockchainVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Blockchain Verified
                        </Badge>
                      )}
                      {campaignData.rpaEnabled && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          <Bot className="h-3 w-3 mr-1" />
                          RPA Enabled
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Your campaign is ready to be published! Once published, it will be visible to all users and ready to
                    receive donations.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={!isStepValid(currentStep)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} size="lg" className="bg-orange-500 hover:bg-orange-600">
              {isLoading ? (
                <>
                  <Zap className="h-4 w-4 mr-2 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Publish Campaign
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
