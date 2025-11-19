"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Server, Database, Zap, Brain, Shield, AlertTriangle, CheckCircle } from "lucide-react"

interface SystemMetrics {
  cpu: number
  memory: number
  database: number
  apiResponseTime: number
  activeUsers: number
  errorRate: number
}

interface MonitoringAlert {
  id: string
  type: "warning" | "error" | "info"
  message: string
  timestamp: string
  resolved: boolean
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [automating, setAutomating] = useState(false)

  useEffect(() => {
    // Simulate fetching monitoring data
    const fetchData = () => {
      const mockMetrics: SystemMetrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        database: Math.random() * 100,
        apiResponseTime: Math.random() * 500 + 50,
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 5,
      }

      const mockAlerts: MonitoringAlert[] = [
        {
          id: "1",
          type: "warning",
          message: "High memory usage detected on server-2",
          timestamp: new Date().toISOString(),
          resolved: false,
        },
        {
          id: "2",
          type: "info",
          message: "Database backup completed successfully",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          resolved: true,
        },
      ]

      setMetrics(mockMetrics)
      setAlerts(mockAlerts)
      setLoading(false)
    }

    fetchData()

    // Update metrics every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const predictFailures = async () => {
    setPredicting(true)
    // Simulate AI prediction
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newAlert: MonitoringAlert = {
      id: Date.now().toString(),
      type: "info",
      message: "AI Prediction: Potential database slowdown in next 2 hours based on current trends",
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    setAlerts((prev) => [newAlert, ...prev])
    setPredicting(false)
  }

  const verifyData = async () => {
    setVerifying(true)
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const newAlert: MonitoringAlert = {
      id: Date.now().toString(),
      type: "info",
      message: "Blockchain verification complete - All monitoring data integrity confirmed",
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    setAlerts((prev) => [newAlert, ...prev])
    setVerifying(false)
  }

  const automateMaintenance = async () => {
    setAutomating(true)
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newAlert: MonitoringAlert = {
      id: Date.now().toString(),
      type: "info",
      message: "RPA Automation: System maintenance tasks completed automatically",
      timestamp: new Date().toISOString(),
      resolved: false,
    }

    setAlerts((prev) => [newAlert, ...prev])
    setAutomating(false)
  }

  const handleMonitoring = () => {
    predictFailures()
    verifyData()
    automateMaintenance()
  }

  const getMetricColor = (value: number, type: "percentage" | "time" | "rate") => {
    if (type === "percentage") {
      if (value > 80) return "text-red-600"
      if (value > 60) return "text-yellow-600"
      return "text-green-600"
    }
    if (type === "time") {
      if (value > 300) return "text-red-600"
      if (value > 150) return "text-yellow-600"
      return "text-green-600"
    }
    if (type === "rate") {
      if (value > 2) return "text-red-600"
      if (value > 1) return "text-yellow-600"
      return "text-green-600"
    }
    return "text-gray-600"
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive" as const
      case "warning":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  if (loading || !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-gray-600">Real-time system health with AI predictions and blockchain verification</p>
        </div>
        <Button onClick={handleMonitoring} disabled={predicting || verifying || automating}>
          {predicting || verifying || automating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Run Full Monitoring
            </>
          )}
        </Button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.cpu, "percentage")}`}>
              {metrics.cpu.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Current load</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.memory, "percentage")}`}>
              {metrics.memory.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">RAM utilization</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.database, "percentage")}`}>
              {metrics.database.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Query performance</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.apiResponseTime, "time")}`}>
              {metrics.apiResponseTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-500">Average response</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Currently online</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, "rate")}`}>
              {metrics.errorRate.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">Last hour</div>
          </CardContent>
        </Card>
      </div>

      {/* AI, Blockchain, RPA Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Predictive Analytics
            </CardTitle>
            <CardDescription>AI-powered failure prediction and optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={predictFailures} disabled={predicting} className="w-full">
              {predicting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Predict Failures
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blockchain Verification
            </CardTitle>
            <CardDescription>Verify monitoring data integrity</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={verifyData} disabled={verifying} className="w-full">
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              RPA Automation
            </CardTitle>
            <CardDescription>Automate maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={automateMaintenance} disabled={automating} className="w-full">
              {automating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Automating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Run Automation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Real-time alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts - System running smoothly</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <AlertDescription className="mb-1">{alert.message}</AlertDescription>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.resolved ? "Resolved" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
