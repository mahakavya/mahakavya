"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { useModerationQueue, useResolveModerationFlag } from "@/hooks/useAdminData"
import { toast } from "sonner"

export function ModerationTable() {
  const { data: flags, isLoading } = useModerationQueue()
  const resolveMutation = useResolveModerationFlag()

  const handleResolve = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      await resolveMutation.mutateAsync({ id, status })
      toast.success(`Flag ${status.toLowerCase()} successfully`)
    } catch (error) {
      toast.error("Failed to resolve flag")
    }
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case "post":
        return "bg-blue-100 text-blue-800"
      case "reel":
        return "bg-purple-100 text-purple-800"
      case "comment":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Moderation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Moderation Queue
            <Badge variant="secondary">{flags?.length || 0} pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!flags || flags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No pending moderation flags</div>
          ) : (
            <div className="space-y-4">
              {flags.map((flag) => (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getContentTypeColor(flag.content_type)}>{flag.content_type}</Badge>
                      <span className="text-sm text-gray-600">{new Date(flag.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="font-medium">{flag.reason}</p>
                    {flag.reporter && (
                      <p className="text-sm text-gray-500">
                        Reported by: {flag.reporter.full_name || flag.reporter.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/content/${flag.content_id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(flag.id, "APPROVED")}
                      disabled={resolveMutation.isPending}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(flag.id, "REJECTED")}
                      disabled={resolveMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
