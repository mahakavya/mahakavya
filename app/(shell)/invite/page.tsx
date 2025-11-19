"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Send, Brain, Shield, Zap, Users, Link, CheckCircle } from "lucide-react"

export default function InvitePage() {
  const [inviteeAddress, setInviteeAddress] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [step, setStep] = useState<"input" | "generating" | "sending" | "verifying" | "complete">("input")

  const generatePersonalizedMessage = async (address: string) => {
    setStep("generating")
    // Simulate AI message generation
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const messages = [
      `🙏 Namaste! You're invited to join our spiritual community on Mahakavya Social. Connect with like-minded souls on a journey of dharma and wisdom. Your unique perspective would enrich our community. Join us in building a platform where ancient wisdom meets modern connection.`,

      `✨ Greetings, seeker! We believe you'd find great value in our conscious community at Mahakavya Social. Share your spiritual journey, learn from others, and contribute to meaningful discussions about dharma, meditation, and personal growth.`,

      `🕉️ Dear friend, you're warmly invited to Mahakavya Social - a platform where spirituality and technology unite. Connect with practitioners, share insights, and be part of a community dedicated to conscious living and spiritual evolution.`,
    ]

    const selectedMessage = messages[Math.floor(Math.random() * messages.length)]
    setInviteMessage(selectedMessage)
    setStep("input")
  }

  const automateInviteProcessing = async (address: string, message: string) => {
    setStep("sending")
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const hash = `0x${Math.random().toString(16).substr(2, 64)}`
    setTransactionHash(hash)
    return hash
  }

  const verifyTransaction = async (hash: string) => {
    setStep("verifying")
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const isValid = Math.random() > 0.1 // 90% success rate
    return isValid
  }

  const handleSendInvite = async () => {
    if (!inviteeAddress || !inviteMessage) return

    setProcessing(true)
    setResult(null)

    try {
      // Step 1: RPA Automation
      const hash = await automateInviteProcessing(inviteeAddress, inviteMessage)

      // Step 2: Blockchain Verification
      const isValid = await verifyTransaction(hash)

      if (isValid) {
        setStep("complete")
        setResult(`✅ Invitation sent successfully!

📧 **Invite Details:**
Recipient: ${inviteeAddress}
Message Length: ${inviteMessage.length} characters

🔗 **Blockchain Record:**
Transaction Hash: ${hash}
Block Number: ${Math.floor(Math.random() * 1000000)}
Status: Confirmed

⚡ **RPA Automation:**
Email Sent: ✓
SMS Notification: ✓
Platform Notification: ✓
Follow-up Scheduled: ✓

🎯 **Next Steps:**
• Recipient will receive email invitation
• Blockchain record ensures invitation authenticity
• Automated follow-up in 3 days if not accepted`)
      } else {
        setResult("❌ Transaction verification failed - Invitation not sent")
      }
    } catch (error) {
      setResult("❌ Failed to send invitation")
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifyTransaction = async () => {
    if (!transactionHash) return

    const isValid = await verifyTransaction(transactionHash)
    setResult(`Transaction ${transactionHash} is ${isValid ? "✅ valid" : "❌ invalid"}`)
  }

  const getStepIcon = (currentStep: string) => {
    switch (currentStep) {
      case "generating":
        return <Brain className="h-4 w-4 text-blue-600" />
      case "sending":
        return <Zap className="h-4 w-4 text-yellow-600" />
      case "verifying":
        return <Shield className="h-4 w-4 text-green-600" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Send className="h-4 w-4 text-gray-600" />
    }
  }

  const getStepText = (currentStep: string) => {
    switch (currentStep) {
      case "generating":
        return "Generating personalized message..."
      case "sending":
        return "Processing invitation..."
      case "verifying":
        return "Verifying on blockchain..."
      case "complete":
        return "Invitation sent successfully!"
      default:
        return "Ready to send"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Invite to Community</h1>
          <p className="text-gray-600">
            Send personalized invitations with AI, blockchain verification, and RPA automation
          </p>
        </div>

        {/* Process Status */}
        {processing && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                {getStepIcon(step)}
                <span className="font-medium">{getStepText(step)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Send Invitation
            </CardTitle>
            <CardDescription>Invite someone to join our spiritual community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Email Address or Blockchain Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter email or blockchain address"
                value={inviteeAddress}
                onChange={(e) => setInviteeAddress(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message">Invitation Message</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generatePersonalizedMessage(inviteeAddress)}
                  disabled={processing || !inviteeAddress}
                >
                  <Brain className="mr-2 h-3 w-3" />
                  AI Generate
                </Button>
              </div>
              <Textarea
                id="message"
                placeholder="Write a personalized invitation message..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={4}
                disabled={processing}
              />
            </div>

            <Button
              onClick={handleSendInvite}
              disabled={processing || !inviteeAddress || !inviteMessage}
              className="w-full"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {getStepText(step)}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction Verification */}
        {transactionHash && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blockchain Verification
              </CardTitle>
              <CardDescription>Verify the invitation transaction on blockchain</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction Hash</Label>
                <div className="flex gap-2">
                  <Input value={transactionHash} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={handleVerifyTransaction} disabled={processing}>
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Alert>
            <AlertDescription className="whitespace-pre-line">{result}</AlertDescription>
          </Alert>
        )}

        {/* Process Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Invitation Process</CardTitle>
            <CardDescription>How our AI + RPA + Blockchain invitation system works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">AI Personalization</h3>
                <p className="text-sm text-gray-600">
                  Generate personalized invitation messages based on recipient context
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">RPA Automation</h3>
                <p className="text-sm text-gray-600">Automate invitation delivery across multiple channels</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Blockchain Verification</h3>
                <p className="text-sm text-gray-600">Record invitations on blockchain for authenticity and tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Recent Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">alice@example.com</div>
                  <div className="text-sm text-gray-600">Sent 2 hours ago</div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">bob@example.com</div>
                  <div className="text-sm text-gray-600">Sent yesterday</div>
                </div>
                <Badge variant="default">Accepted</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
