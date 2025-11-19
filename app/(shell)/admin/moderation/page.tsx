"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Shield, Zap, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface ModerationItem {
  id: string
  content: string
  type: "post" | "comment" | "message"
  status: "pending" | "approved" | "rejected"
  aiScore: number
  timestamp: string
  author: string
}

export default function ModerationPage() {
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([])
  const [testContent, setTestContent] = useState("")
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching moderation queue
    const mockQueue: ModerationItem[] = [
      {
        id: "1",
        content: "This is a sample post about spiritual practices and meditation.",
        type: "post",
        status: "pending",
        aiScore: 0.95,
        timestamp: new Date().toISOString(),
        author: "user@example.com",
      },
      {
        id: "2",
        content: "Inappropriate content that needs review...",
        type: "comment",
        status: "pending",
        aiScore: 0.25,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        author: "another@example.com",
      },
    ]

    setModerationQueue(mockQueue)
    setLoading(false)
  }, [])

  const handleModeration = async (content: string) => {
    setProcessing(true)
    setResult(null)

    try {
      // Simulate AI content analysis
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const aiScore = Math.random()
      const isAppropriate = aiScore > 0.5

      if (!isAppropriate) {
        setResult("❌ Content flagged as inappropriate by AI analysis")
        setProcessing(false)
        return
      }

      // Simulate RPA workflow automation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const workflowResult = {
        success: true,
        actionId: `action_${Date.now()}`,
      }

      if (!workflowResult.success) {
        setResult("⚠️ Workflow automation failed")
        setProcessing(false)
        return
      }

      // Simulate blockchain verification
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const verificationResult = {
        verified: true,
        transactionHash: `0x${Math.random().toString(16).substr(2, 8)}`,
      }

      if (!verificationResult.verified) {
        setResult("🔒 Blockchain verification failed")
        setProcessing(false)
        return
      }

      setResult(`✅ Moderation completed successfully! 
      
AI Score: ${(aiScore * 100).toFixed(1)}%
Workflow ID: ${workflowResult.actionId}
Blockchain Hash: ${verificationResult.transactionHash}`)
    } catch (error) {
      setResult("❌ Moderation process failed")
    } finally {
      setProcessing(false)
    }
  }

  const moderateItem = async (item: ModerationItem, action: "approve" | "reject") => {
    const updatedQueue = moderationQueue.map((queueItem) =>
      queueItem.id === item.id
        ? { ...queueItem, status: action === "approve" ? "approved" : ("rejected" as const) }
        : queueItem,
    )
    setModerationQueue(updatedQueue)

    // Trigger moderation workflow
    await handleModeration(item.content)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default" as const,
      rejected: "destructive" as const,
      pending: "secondary" as const,
    }
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getAIScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.5) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-gray-600">AI-powered content moderation with blockchain verification</p>
        </div>
      </div>

      {/* Test Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Test Content Moderation
          </CardTitle>
          <CardDescription>Test the AI + RPA + Blockchain moderation pipeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter content to moderate..."
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            rows={3}
          />
          <Button
            onClick={() => handleModeration(testContent)}
            disabled={processing || !testContent.trim()}
            className="w-full"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Moderate Content
              </>
            )}
          </Button>

          {result && (
            <Alert>
              <AlertDescription className="whitespace-pre-line">{result}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
          <CardDescription>Content awaiting moderation review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moderationQueue.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(item.status)}
                      <Badge variant="outline">{item.type}</Badge>
                      {getStatusBadge(item.status)}
                      <span className="text-sm text-gray-500">{item.author}</span>
                    </div>
                    <p className="text-sm mb-2">{item.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        AI Score:{" "}
                        <span className={getAIScoreColor(item.aiScore)}>{(item.aiScore * 100).toFixed(1)}%</span>
                      </span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => moderateItem(item, "approve")} disabled={processing}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => moderateItem(item, "reject")}
                      disabled={processing}
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Moderation Process</CardTitle>
          <CardDescription>How our AI + RPA + Blockchain moderation works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">Content is analyzed for appropriateness using machine learning</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">RPA Workflow</h3>
              <p className="text-sm text-gray-600">Automated workflows handle the moderation process</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Blockchain Verification</h3>
              <p className="text-sm text-gray-600">Actions are verified and recorded on blockchain</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
