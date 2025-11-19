"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Eye, EyeOff, CheckCircle, XCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { formatIST } from "@/lib/dates"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SafetyFlag {
  id: string
  entity_type: "post" | "reel" | "comment"
  entity_id: string
  reason: string
  score: number
  status: "open" | "reviewing" | "dismissed" | "actioned"
  created_at: string
}

export function SafetyTable() {
  const [flags, setFlags] = useState<SafetyFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("open")
  const [actionDialog, setActionDialog] = useState<{
    flag: SafetyFlag
    action: string
    title: string
    description: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/safety?status=${status}&limit=50`)
      if (!response.ok) throw new Error("Failed to fetch safety flags")

      const data = await response.json()
      setFlags(data.items || [])
    } catch (error) {
      console.error("Error fetching safety flags:", error)
      toast({
        title: "Error",
        description: "Failed to load safety flags",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [status])

  const handleAction = async (flag: SafetyFlag, action: string) => {
    const actionMap = {
      mark_reviewing: {
        title: "Mark as Reviewing",
        description: "This will mark the flag as under review.",
      },
      dismiss: {
        title: "Dismiss Flag",
        description: "This will dismiss the safety flag without taking action.",
      },
      action_hide: {
        title: "Hide Content",
        description: "This will hide the content from public view and mark the flag as actioned.",
      },
      action_unhide: {
        title: "Unhide Content",
        description: "This will make the content visible again and mark the flag as actioned.",
      },
    }

    const actionInfo = actionMap[action as keyof typeof actionMap]
    if (!actionInfo) return

    setActionDialog({
      flag,
      action,
      title: actionInfo.title,
      description: actionInfo.description,
    })
  }

  const confirmAction = async () => {
    if (!actionDialog) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/admin/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: actionDialog.flag.id,
          action: actionDialog.action,
        }),
      })

      if (!response.ok) throw new Error("Failed to perform action")

      toast({
        title: "Success",
        description: "Action completed successfully",
      })

      // Refresh the flags list
      fetchFlags()
      setActionDialog(null)
    } catch (error) {
      console.error("Error performing action:", error)
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      reviewing: "secondary",
      dismissed: "outline",
      actioned: "default",
    } as const

    const icons = {
      open: AlertTriangle,
      reviewing: Clock,
      dismissed: XCircle,
      actioned: CheckCircle,
    }

    const Icon = icons[status as keyof typeof icons]

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getScoreBadge = (score: number) => {
    if (score >= 0.9) return <Badge variant="destructive">High ({score.toFixed(2)})</Badge>
    if (score >= 0.6) return <Badge variant="secondary">Medium ({score.toFixed(2)})</Badge>
    return <Badge variant="outline">Low ({score.toFixed(2)})</Badge>
  }

  const getEntityLink = (entityType: string, entityId: string) => {
    const links = {
      post: `/samvaaha`, // Would need post-specific routing
      reel: `/drishya`,
      comment: `/samvaaha`, // Would need comment-specific routing
    }
    return links[entityType as keyof typeof links] || "#"
  }

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card
        className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm"
        data-testid="admin-safety-table"
      >
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Safety Flags</CardTitle>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="actioned">Actioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No safety flags found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{flag.entity_type}</Badge>
                          <a
                            href={getEntityLink(flag.entity_type, flag.entity_id)}
                            className="text-blue-600 hover:underline text-sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{flag.reason.replace("-", " ")}</span>
                      </TableCell>
                      <TableCell>{getScoreBadge(flag.score)}</TableCell>
                      <TableCell>{getStatusBadge(flag.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatIST(flag.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {flag.status === "open" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAction(flag, "mark_reviewing")}>
                                Review
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAction(flag, "action_hide")}>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAction(flag, "dismiss")}>
                                Dismiss
                              </Button>
                            </>
                          )}
                          {flag.status === "reviewing" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAction(flag, "action_hide")}>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hide
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAction(flag, "dismiss")}>
                                Dismiss
                              </Button>
                            </>
                          )}
                          {flag.status === "actioned" && (
                            <Button size="sm" variant="outline" onClick={() => handleAction(flag, "action_unhide")}>
                              <Eye className="h-3 w-3 mr-1" />
                              Unhide
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog?.title}</DialogTitle>
            <DialogDescription>{actionDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
