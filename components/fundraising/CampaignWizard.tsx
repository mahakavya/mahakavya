"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatINR } from "@/lib/money"
import { Upload, ArrowLeft, ArrowRight, Check } from "lucide-react"
import Image from "next/image"

interface CampaignWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasActiveSubscription: boolean
}

interface CampaignData {
  title: string
  description: string
  goalAmount: string
  coverFile?: File
  coverUrl?: string
}

const steps = [
  { id: 1, title: "Basics", description: "Campaign details" },
  { id: 2, title: "Goal & Cover", description: "Funding goal and image" },
  { id: 3, title: "Review", description: "Review and publish" },
]

export function CampaignWizard({ open, onOpenChange, hasActiveSubscription }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: "",
    description: "",
    goalAmount: "",
  })
  const { toast } = useToast()
  const router = useRouter()

  if (!hasActiveSubscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Active Subscription Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">You need an active subscription to create fundraising campaigns.</p>
            <Button
              onClick={() => {
                onOpenChange(false)
                router.push("/billing")
              }}
              className="w-full"
            >
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleNext = () => {
    if (currentStep < 3) {
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
      // Dynamically import the storage helper at call time to avoid bundling server-only code
      const { uploadCampaignCover } = await import("@/lib/storage")
      const result = await uploadCampaignCover(file, "temp") // Will be updated with actual user ID
      setCampaignData((prev) => ({
        ...prev,
        coverFile: file,
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

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Create campaign
      const response = await fetch("/api/fundraising/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: campaignData.title,
          description: campaignData.description,
          goalAmount: Number.parseInt(campaignData.goalAmount),
          coverUrl: campaignData.coverUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create campaign")
      }

      const campaign = await response.json()

      // Publish campaign
      const publishResponse = await fetch(`/api/fundraising/campaigns/${campaign.id}/publish`, {
        method: "POST",
      })

      if (!publishResponse.ok) {
        throw new Error("Failed to publish campaign")
      }

      toast({
        title: "Campaign created!",
        description: "Your fundraising campaign is now live.",
      })

      onOpenChange(false)
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
        return campaignData.title.length >= 3 && campaignData.description.length >= 20
      case 2:
        return Number.parseInt(campaignData.goalAmount) >= 1000
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fundraising Campaign</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${currentStep >= step.id ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"}
              `}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && <div className="w-8 h-px bg-gray-300 mx-4" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  value={campaignData.title}
                  onChange={(e) => setCampaignData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a compelling campaign title"
                  maxLength={120}
                />
                <div className="text-xs text-gray-500 mt-1">{campaignData.title.length}/120 characters</div>
              </div>

              <div>
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  value={campaignData.description}
                  onChange={(e) => setCampaignData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your campaign, its purpose, and why people should support it..."
                  rows={6}
                  maxLength={5000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {campaignData.description.length}/5000 characters (minimum 20)
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalAmount">Funding Goal (₹)</Label>
                <Input
                  id="goalAmount"
                  type="number"
                  value={campaignData.goalAmount}
                  onChange={(e) => setCampaignData((prev) => ({ ...prev, goalAmount: e.target.value }))}
                  placeholder="100000"
                  min="1000"
                  max="100000000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Minimum: ₹1,000 • Maximum: ₹10 crores
                  {campaignData.goalAmount && (
                    <span className="block font-medium text-gray-700">
                      Goal: {formatINR(Number.parseInt(campaignData.goalAmount) || 0)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label>Campaign Cover Image</Label>
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
                          setCampaignData((prev) => ({ ...prev, coverUrl: undefined, coverFile: undefined }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 mb-2">Upload a cover image for your campaign</div>
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
                        size="sm"
                        onClick={() => document.getElementById("cover-upload")?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? "Uploading..." : "Choose Image"}
                      </Button>
                      <div className="text-xs text-gray-500 mt-2">Maximum 5MB • JPG, PNG, WebP</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Review Your Campaign
                  <Badge variant="secondary">Ready to Publish</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Title</h4>
                  <p className="text-gray-600">{campaignData.title}</p>
                </div>

                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-gray-600 text-sm line-clamp-3">{campaignData.description}</p>
                </div>

                <div>
                  <h4 className="font-medium">Funding Goal</h4>
                  <p className="text-gray-600 font-semibold">
                    {formatINR(Number.parseInt(campaignData.goalAmount) || 0)}
                  </p>
                </div>

                {campaignData.coverUrl && (
                  <div>
                    <h4 className="font-medium mb-2">Cover Image</h4>
                    <div className="aspect-video w-32 rounded-lg overflow-hidden">
                      <Image
                        src={campaignData.coverUrl || "/placeholder.svg"}
                        alt="Campaign cover"
                        width={128}
                        height={72}
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Ready to publish:</strong> Your campaign will be immediately visible to all users and ready
                    to receive donations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={!isStepValid(currentStep)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create & Publish Campaign"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
