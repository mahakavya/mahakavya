"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, CheckCircle, Clock } from "lucide-react"

interface AuditLog {
  id: string
  timestamp: string
  action: string
  user: string
  status: "success" | "warning" | "error"
  details?: string
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [anomalies, setAnomalies] = useState<AuditLog[]>([])

  useEffect(() => {
    // Simulate fetching audit logs
    const mockLogs: AuditLog[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        action: "User Login",
        user: "admin@example.com",
        status: "success",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        action: "Content Moderation",
        user: "moderator@example.com",
        status: "warning",
        details: "Flagged content reviewed",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        action: "Failed Login Attempt",
        user: "unknown@example.com",
        status: "error",
        details: "Multiple failed attempts detected",
      },
    ]

    setAuditLogs(mockLogs)

    // Detect anomalies (simplified)
    const detectedAnomalies = mockLogs.filter((log) => log.status === "error" || log.action.includes("Failed"))
    setAnomalies(detectedAnomalies)

    setLoading(false)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default" as const,
      warning: "secondary" as const,
      error: "destructive" as const,
    }
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
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
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">Monitor system activities and detect anomalies</p>
        </div>
        <Button>
          <Shield className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Detected Anomalies ({anomalies.length})
            </CardTitle>
            <CardDescription className="text-red-700">
              AI-powered anomaly detection has identified suspicious activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(anomaly.status)}
                    <div>
                      <div className="font-medium">{anomaly.action}</div>
                      <div className="text-sm text-gray-600">{anomaly.user}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(anomaly.status)}
                    <div className="text-xs text-gray-500 mt-1">{new Date(anomaly.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>All system activities with blockchain verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-gray-600">{log.user}</div>
                    {log.details && <div className="text-xs text-gray-500 mt-1">{log.details}</div>}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(log.status)}
                  <div className="text-xs text-gray-500 mt-1">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
