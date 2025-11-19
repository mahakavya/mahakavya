"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MessageCircle, Settings, Bot, Shield, Zap } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { AccessGate } from "@/components/access-gate"
import { ConversationList } from "@/components/chat/ConversationList"
import { ChatPane } from "@/components/chat/ChatPane"
import { NewConversationDialog } from "@/components/chat/NewConversationDialog"
import { AIMessageInsights } from "@/components/chat/AIMessageInsights"
import { BlockchainMessageStatus } from "@/components/chat/BlockchainMessageStatus"
import { RPAMessageStatus } from "@/components/chat/RPAMessageStatus"
import { MessageAnalytics } from "@/components/chat/MessageAnalytics"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Menu } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TechnologyStatus {
  ai: {
    status: "active" | "inactive" | "processing"
    smartReplies: number
    sentimentAnalysis: boolean
    languageTranslation: boolean
  }
  blockchain: {
    status: "verified" | "pending" | "failed"
    messagesVerified: number
    integrityScore: number
    lastVerification: string
  }
  rpa: {
    status: "running" | "paused" | "error"
    automatedActions: number
    spamDetected: number
    engagementOptimized: boolean
  }
}

export default function VartaPage() {
  const [selectedConversation, setSelectedConversation] = useState<string>()
  const [showMobileList, setShowMobileList] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>()
  const [technologyStatus, setTechnologyStatus] = useState<TechnologyStatus>({
    ai: {
      status: "active",
      smartReplies: 0,
      sentimentAnalysis: true,
      languageTranslation: true,
    },
    blockchain: {
      status: "verified",
      messagesVerified: 0,
      integrityScore: 98.5,
      lastVerification: new Date().toISOString(),
    },
    rpa: {
      status: "running",
      automatedActions: 0,
      spamDetected: 0,
      engagementOptimized: true,
    },
  })
  const [analytics, setAnalytics] = useState({
    totalMessages: 0,
    activeConversations: 0,
    responseTime: "2.3s",
    engagementScore: 85,
  })
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  // Get conversation ID from URL
  useEffect(() => {
    const conversationId = searchParams.get("c")
    if (conversationId) {
      setSelectedConversation(conversationId)
    }
  }, [searchParams])

  // Get current user ID (in a real app, this would come from auth context)
  useEffect(() => {
    // TODO: Get from auth context
    setCurrentUserId("current-user-id")
  }, [])

  // Load technology status
  useEffect(() => {
    const loadTechnologyStatus = async () => {
      try {
        const [aiResponse, blockchainResponse, rpaResponse] = await Promise.all([
          fetch("/api/chat/ai-insights"),
          fetch("/api/chat/blockchain-status"),
          fetch("/api/chat/rpa-status"),
        ])

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          setTechnologyStatus((prev) => ({
            ...prev,
            ai: {
              ...prev.ai,
              smartReplies: aiData.smartReplies || 0,
              sentimentAnalysis: aiData.sentimentAnalysis || true,
              languageTranslation: aiData.languageTranslation || true,
            },
          }))
        }

        if (blockchainResponse.ok) {
          const blockchainData = await blockchainResponse.json()
          setTechnologyStatus((prev) => ({
            ...prev,
            blockchain: {
              ...prev.blockchain,
              messagesVerified: blockchainData.messagesVerified || 0,
              integrityScore: blockchainData.integrityScore || 98.5,
              lastVerification: blockchainData.lastVerification || new Date().toISOString(),
            },
          }))
        }

        if (rpaResponse.ok) {
          const rpaData = await rpaResponse.json()
          setTechnologyStatus((prev) => ({
            ...prev,
            rpa: {
              ...prev.rpa,
              automatedActions: rpaData.automatedActions || 0,
              spamDetected: rpaData.spamDetected || 0,
              engagementOptimized: rpaData.engagementOptimized || true,
            },
          }))
        }
      } catch (error) {
        console.error("Error loading technology status:", error)
      }
    }

    loadTechnologyStatus()
    const interval = setInterval(loadTechnologyStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch("/api/chat/analytics")
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error("Error loading analytics:", error)
      }
    }

    loadAnalytics()
  }, [])

  // Heartbeat for presence
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/chat/presence", { method: "POST" }).catch(console.error)
    }, 45000) // 45 seconds

    return () => clearInterval(interval)
  }, [])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId)
    setShowMobileList(false)

    // Update URL
    const params = new URLSearchParams(searchParams)
    params.set("c", conversationId)
    router.push(`/varta?${params.toString()}`)
  }

  const handleBackToList = () => {
    setSelectedConversation(undefined)
    setShowMobileList(true)

    // Clear URL param
    const params = new URLSearchParams(searchParams)
    params.delete("c")
    const newUrl = params.toString() ? `/varta?${params.toString()}` : "/varta"
    router.push(newUrl)
  }

  const handleOptimizeAI = async () => {
    try {
      const response = await fetch("/api/chat/ai-optimize", { method: "POST" })
      if (response.ok) {
        toast({
          title: "AI Optimization Complete",
          description: "Smart replies and sentiment analysis have been optimized for better performance.",
        })
      }
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize AI features at this time.",
        variant: "destructive",
      })
    }
  }

  const handleVerifyBlockchain = async () => {
    try {
      const response = await fetch("/api/chat/blockchain-verify", { method: "POST" })
      if (response.ok) {
        toast({
          title: "Blockchain Verification Complete",
          description: "All recent messages have been verified on the blockchain.",
        })
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify messages on blockchain at this time.",
        variant: "destructive",
      })
    }
  }

  const handleOptimizeRPA = async () => {
    try {
      const response = await fetch("/api/chat/rpa-optimize", { method: "POST" })
      if (response.ok) {
        toast({
          title: "RPA Optimization Complete",
          description: "Automated processes have been optimized for better engagement.",
        })
      }
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize RPA processes at this time.",
        variant: "destructive",
      })
    }
  }

  return (
    <AccessGate feature="messaging">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Sheet open={showMobileList} onOpenChange={setShowMobileList}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-white/90 backdrop-blur-md border-white/40">
                <ConversationList selectedId={selectedConversation} onSelect={handleSelectConversation} />
              </SheetContent>
            </Sheet>

            <PageHeader title="Varta" subtitle="Secure messaging with AI, Blockchain & RPA" />
          </div>

          <div className="flex items-center space-x-2">
            <NewConversationDialog onSelect={handleSelectConversation} />
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Technology Status Cards */}
        <div className="p-4 border-b border-white/20 bg-white/20 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Status */}
            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Bot className="w-4 h-4 mr-2 text-blue-600" />
                    AI Intelligence
                  </CardTitle>
                  <Badge variant={technologyStatus.ai.status === "active" ? "default" : "secondary"}>
                    {technologyStatus.ai.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Smart Replies: {technologyStatus.ai.smartReplies}</div>
                  <div>Sentiment Analysis: {technologyStatus.ai.sentimentAnalysis ? "✓" : "✗"}</div>
                  <div>Translation: {technologyStatus.ai.languageTranslation ? "✓" : "✗"}</div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2 bg-transparent" onClick={handleOptimizeAI}>
                  Optimize AI
                </Button>
              </CardContent>
            </Card>

            {/* Blockchain Status */}
            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    Blockchain Security
                  </CardTitle>
                  <Badge variant={technologyStatus.blockchain.status === "verified" ? "default" : "secondary"}>
                    {technologyStatus.blockchain.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Messages Verified: {technologyStatus.blockchain.messagesVerified}</div>
                  <div>Integrity Score: {technologyStatus.blockchain.integrityScore}%</div>
                  <div>Last Check: {new Date(technologyStatus.blockchain.lastVerification).toLocaleTimeString()}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={handleVerifyBlockchain}
                >
                  Verify Now
                </Button>
              </CardContent>
            </Card>

            {/* RPA Status */}
            <Card className="bg-white/60 backdrop-blur-md border-white/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-600" />
                    RPA Automation
                  </CardTitle>
                  <Badge variant={technologyStatus.rpa.status === "running" ? "default" : "secondary"}>
                    {technologyStatus.rpa.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Auto Actions: {technologyStatus.rpa.automatedActions}</div>
                  <div>Spam Blocked: {technologyStatus.rpa.spamDetected}</div>
                  <div>Optimized: {technologyStatus.rpa.engagementOptimized ? "✓" : "✗"}</div>
                </div>
                <Button size="sm" variant="outline" className="w-full mt-2 bg-transparent" onClick={handleOptimizeRPA}>
                  Optimize RPA
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-80 border-r border-white/20 bg-white/20 backdrop-blur-sm">
            <Tabs defaultValue="conversations" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 m-2">
                <TabsTrigger value="conversations">Chats</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="conversations" className="flex-1 overflow-hidden">
                <ConversationList selectedId={selectedConversation} onSelect={handleSelectConversation} />
              </TabsContent>

              <TabsContent value="insights" className="flex-1 overflow-auto p-4">
                <AIMessageInsights />
                <BlockchainMessageStatus />
                <RPAMessageStatus />
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 overflow-auto p-4">
                <MessageAnalytics analytics={analytics} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <ChatPane
                conversationId={selectedConversation}
                onBack={handleBackToList}
                currentUserId={currentUserId}
                aiEnabled={technologyStatus.ai.status === "active"}
                blockchainEnabled={technologyStatus.blockchain.status === "verified"}
                rpaEnabled={technologyStatus.rpa.status === "running"}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <EmptyState
                  icon={MessageCircle}
                  title="Welcome to Varta"
                  subtitle="Experience secure messaging powered by AI, Blockchain, and RPA technologies. Start a conversation to begin."
                  action={{
                    label: "Start New Chat",
                    onClick: () => console.log("New message clicked"),
                  }}
                />

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                  <Card className="bg-white/40 backdrop-blur-md border-white/40 text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">{analytics.totalMessages}</div>
                      <div className="text-sm text-gray-600">Total Messages</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/40 backdrop-blur-md border-white/40 text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">{analytics.activeConversations}</div>
                      <div className="text-sm text-gray-600">Active Chats</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/40 backdrop-blur-md border-white/40 text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">{analytics.responseTime}</div>
                      <div className="text-sm text-gray-600">Avg Response</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/40 backdrop-blur-md border-white/40 text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">{analytics.engagementScore}%</div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccessGate>
  )
}
