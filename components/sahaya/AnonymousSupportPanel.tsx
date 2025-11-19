"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Lock, Shield, Eye, EyeOff, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AnonymousSupportPanelProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function AnonymousSupportPanel({ enabled, onToggle }: AnonymousSupportPanelProps) {
  const [isStartingSession, setIsStartingSession] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleStartAnonymousSession = async () => {
    setIsStartingSession(true)

    try {
      const response = await fetch("/api/sahaya/anonymous-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymous: true }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Anonymous Session Started",
          description: "You've been connected to a listener anonymously.",
        })
        // Redirect to session
        window.location.href = `/sahaya/session/${data.sessionId}`
      } else {
        throw new Error("Failed to start session")
      }
    } catch (error) {
      toast({
        title: "Session Failed",
        description: "Unable to start anonymous session. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsStartingSession(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Simulate connecting to an anonymous listener
      await new Promise((resolve) => setTimeout(resolve, 2000))
      alert("Connected to an anonymous listener!")
    } catch (error) {
      console.error("Failed to connect:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Anonymous Mode Control */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-gray-600" />
            <span>Anonymous Support Mode</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Enable Anonymous Mode</h4>
              <p className="text-sm text-gray-600">Hide your identity during support sessions</p>
            </div>
            <Switch checked={enabled} onCheckedChange={onToggle} />
          </div>

          {enabled && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Privacy Protection Active</span>
              </div>
              <p className="text-sm text-blue-700">
                Your identity is completely hidden. Listeners will see you as "Anonymous User" and your profile
                information will not be shared.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anonymous Features */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader>
          <CardTitle>Anonymous Support Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <EyeOff className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">Complete Privacy</span>
              </div>
              <p className="text-sm text-green-700">No personal information shared with listeners</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-800">Encrypted Sessions</span>
              </div>
              <p className="text-sm text-purple-700">End-to-end encrypted conversations</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Anonymous Matching</span>
              </div>
              <p className="text-sm text-blue-700">AI-powered matching without revealing identity</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">No Session History</span>
              </div>
              <p className="text-sm text-yellow-700">Sessions are not saved to your profile</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Anonymous Session */}
      {enabled && (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MessageSquare className="h-5 w-5" />
              Anonymous Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-800">
              Get immediate emotional support from a trained listener. Your identity will be kept anonymous.
            </p>
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full">
              {isConnecting ? "Connecting..." : "Connect Anonymously"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
