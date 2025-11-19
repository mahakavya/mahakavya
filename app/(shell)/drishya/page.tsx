"use client"

import { AccessGate } from "@/components/access-gate"
import { ReelsHeader } from "@/components/reels/ReelsHeader"
import { AIReelsInsights } from "@/components/reels/AIReelsInsights"
import { BlockchainReelsStatus } from "@/components/reels/BlockchainReelsStatus"
import { RPAReelsStatus } from "@/components/reels/RPAReelsStatus"
import { TrendingReels } from "@/components/reels/TrendingReels"
import { ReelsAnalytics } from "@/components/reels/ReelsAnalytics"
import { DrishyaFeed } from "@/components/drishya/DrishyaFeed"
import { PageHeader } from "@/components/page-header"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DrishyaPage() {
  const [showInsights, setShowInsights] = useState(false)
  const [aiOptimizationEnabled, setAiOptimizationEnabled] = useState(true)
  const [blockchainVerificationEnabled, setBlockchainVerificationEnabled] = useState(true)
  const [rpaAutomationEnabled, setRpaAutomationEnabled] = useState(true)
  const { toast } = useToast()

  const handleReelCreated = async (reel: any) => {
    try {
      // AI Enhancement
      if (aiOptimizationEnabled) {
        await fetch("/api/reels/ai-enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reelId: reel.id }),
        })
      }

      // Blockchain Verification
      if (blockchainVerificationEnabled) {
        await fetch("/api/reels/blockchain-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reelId: reel.id }),
        })
      }

      // RPA Processing
      if (rpaAutomationEnabled) {
        await fetch("/api/reels/rpa-process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reelId: reel.id }),
        })
      }

      toast({
        title: "Reel uploaded successfully!",
        description: "Your reel is being processed with AI, Blockchain, and RPA technologies.",
      })
    } catch (error) {
      console.error("Error processing reel:", error)
      toast({
        title: "Processing error",
        description: "Your reel was uploaded but some features may be limited.",
        variant: "destructive",
      })
    }
  }

  const handleCommentClick = (reelId: string) => {
    console.log("Comment clicked for reel:", reelId)
    // TODO: Implement comment modal with AI-powered sentiment analysis
  }

  const handleAIOptimization = async () => {
    try {
      const response = await fetch("/api/reels/ai-optimize-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast({
          title: "AI Optimization Applied",
          description: "Your feed has been optimized based on your preferences.",
        })
      }
    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Unable to apply AI optimization at this time.",
        variant: "destructive",
      })
    }
  }

  const handleBlockchainVerification = async () => {
    try {
      const response = await fetch("/api/reels/blockchain-verify-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast({
          title: "Blockchain Verification Initiated",
          description: "All your reels are being verified on the blockchain.",
        })
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Unable to initiate blockchain verification.",
        variant: "destructive",
      })
    }
  }

  const handleRPAAutomization = async () => {
    try {
      const response = await fetch("/api/reels/rpa-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast({
          title: "RPA Automation Enabled",
          description: "Automated engagement optimization is now active.",
        })
      }
    } catch (error) {
      toast({
        title: "Automation failed",
        description: "Unable to enable RPA automation.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      <PageHeader
        title="Drishya"
        description="Discover amazing short videos"
        className="flex-shrink-0 bg-black text-white border-gray-800"
      />

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<DrishyaFeedSkeleton />}>
          <AccessGate feature="reels">
            {/* Fixed Header */}
            <ReelsHeader onReelCreated={handleReelCreated} />

            {/* Technology Status Bar */}
            <div className="fixed top-16 left-0 right-0 z-40 bg-black/80 backdrop-blur-sm border-b border-gray-800">
              <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
                <AIReelsInsights
                  enabled={aiOptimizationEnabled}
                  onToggle={setAiOptimizationEnabled}
                  onOptimize={handleAIOptimization}
                />
                <BlockchainReelsStatus
                  enabled={blockchainVerificationEnabled}
                  onToggle={setBlockchainVerificationEnabled}
                  onVerify={handleBlockchainVerification}
                />
                <RPAReelsStatus
                  enabled={rpaAutomationEnabled}
                  onToggle={setRpaAutomationEnabled}
                  onOptimize={handleRPAAutomization}
                />
              </div>
            </div>

            {/* Insights Panel */}
            {showInsights && (
              <div className="fixed top-32 left-0 right-0 z-30 bg-black/90 backdrop-blur-md border-b border-gray-800">
                <div className="max-w-md mx-auto p-4">
                  <ReelsAnalytics />
                  <TrendingReels />
                </div>
              </div>
            )}

            {/* Main Feed */}
            <div className="pt-32 h-full">
              <DrishyaFeed onCommentClick={handleCommentClick} />
            </div>

            {/* Floating Insights Toggle */}
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="fixed bottom-20 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-colors"
              aria-label="Toggle insights panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </button>
          </AccessGate>
        </Suspense>
      </div>
    </div>
  )
}

function DrishyaFeedSkeleton() {
  return (
    <div className="h-full w-full bg-black flex items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32 bg-gray-800" />
        <Skeleton className="h-4 w-48 bg-gray-800" />
        <div className="flex space-x-2">
          <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
          <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
          <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
