"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { useAuditLogs } from "@/hooks/useAdminData"
import { formatDistanceToNow } from "date-fns"

export function AuditList() {
  const { data: logs, isLoading } = useAuditLogs()

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-green-100 text-green-800"
    if (action.includes("delete")) return "bg-red-100 text-red-800"
    if (action.includes("update") || action.includes("resolve")) return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
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
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No audit logs available</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors"
                >
                  <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.actor?.full_name || log.actor?.email || "System"}</span>
                      {" → "}
                      <span>{log.action}</span>
                      {log.target && (
                        <>
                          {" on "}
                          <span className="font-medium">{log.target}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
