"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Share2, Facebook, Twitter, MessageCircle, Mail, Copy } from "lucide-react"

interface SocialSharePanelProps {
  campaignId: string
  title: string
  description: string
}

export function SocialSharePanel({ campaignId, title, description }: SocialSharePanelProps) {
  const [isSharing, setIsSharing] = useState<string | null>(null)
  const { toast } = useToast()

  const campaignUrl = typeof window !== "undefined" ? window.location.href : ""
  const shareText = `Check out this fundraising campaign: ${title}`

  const trackShare = async (platform: string) => {
    try {
      await fetch(`/api/fundraising/campaigns/${campaignId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
    } catch (error) {
      console.error("Failed to track share:", error)
    }
  }

  const handleShare = async (platform: string, url: string) => {
    setIsSharing(platform)
    try {
      window.open(url, "_blank", "width=600,height=400")
      await trackShare(platform)
      toast({
        title: "Shared successfully",
        description: `Campaign shared on ${platform}`,
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share campaign. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(null)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl)
      await trackShare("clipboard")
      toast({
        title: "Link copied",
        description: "Campaign link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(campaignUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${campaignUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${campaignUrl}`)}`,
  }

  return (
    <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-green-500" />
          Share Campaign
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("facebook", shareUrls.facebook)}
              disabled={isSharing === "facebook"}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("twitter", shareUrls.twitter)}
              disabled={isSharing === "twitter"}
              className="flex items-center gap-2"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("whatsapp", shareUrls.whatsapp)}
              disabled={isSharing === "whatsapp"}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare("email", shareUrls.email)}
              disabled={isSharing === "email"}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4 text-gray-600" />
              Email
            </Button>
          </div>

          {/* Copy Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 bg-transparent"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>

          {/* Share Stats */}
          <div className="text-xs text-gray-500 text-center">Help spread the word and increase donations</div>
        </div>
      </CardContent>
    </Card>
  )
}
