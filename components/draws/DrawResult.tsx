"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Trophy, Hash, Calendar, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DrawResultProps {
  result: {
    closed_at: string
    algorithm: string
    N: number
    winner_user_id: string
    proof: {
      seed: string
      closed_at: string
      hash: string
      txHash?: string
    }
  }
}

export function DrawResult({ result }: DrawResultProps) {
  const [copiedHash, setCopiedHash] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
      toast({
        title: "Copied!",
        description: "Proof hash copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  return (
    <Card
      className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm"
      data-testid="draw-result"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Trophy className="h-5 w-5" />
          Draw Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Winner Announcement */}
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-800 mb-2">🎉 Winner Selected!</div>
          <div className="text-sm text-green-600">Winner ID: {result.winner_user_id.slice(0, 8)}...</div>
        </div>

        {/* Draw Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Total Entries:</span>
            <Badge variant="secondary">{result.N}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Closed:</span>
            <span className="font-mono text-xs">{new Date(result.closed_at).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Algorithm Details */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Algorithm</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <code className="text-xs text-gray-700 break-all">{result.algorithm}</code>
          </div>
        </div>

        {/* Proof Hash */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Proof Hash
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 p-2 rounded border">
              <code className="text-xs text-gray-700 break-all">{result.proof.hash}</code>
            </div>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.proof.hash)}>
              {copiedHash ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Blockchain Transaction (if available) */}
        {result.proof.txHash && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Blockchain Proof</h4>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                Transaction Hash:
                <code className="ml-2 text-xs break-all">{result.proof.txHash}</code>
              </div>
            </div>
          </div>
        )}

        {/* Verification Note */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>Verification:</strong> This result was generated using a deterministic algorithm based on the draw
          seed and closing timestamp. The proof hash can be independently verified to ensure fairness.
        </div>
      </CardContent>
    </Card>
  )
}
