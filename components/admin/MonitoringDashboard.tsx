"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { monitoring } from "@/lib/monitoring"
import { AlertTriangle, Activity, Users, Zap, RefreshCw } from "lucide-react"

interface MonitoringEvent {
  type: "error" | "performance" | "user_action" | "api_call"
  message: string
  data?: any
  timestamp: Date
  userId?: string
}

export function MonitoringDashboard() {
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    recentEvents: 0,
    errorCount: 0,
    performanceEvents: 0,
    userActions: 0,
    apiCalls: 0,
  })

  const refreshData = () => {
    setEvents(monitoring.getEvents())
    setMetrics(monitoring.getMetrics())
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "destructive"
      case "performance":
        return "secondary"
      case "user_action":
        return "default"
      case "api_call":
        return "outline"
      default:
        return "default"
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-amber-900">System Monitoring</h2>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{metrics.recentEvents} in last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.errorCount}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.userActions}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.apiCalls}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="error">Errors</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="user_action">User Actions</TabsTrigger>
              <TabsTrigger value="api_call">API Calls</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 max-h-96 overflow-y-auto">
              {events
                .slice(-50)
                .reverse()
                .map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getEventTypeColor(event.type) as any}>{event.type}</Badge>
                      <span className="font-medium">{event.message}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                  </div>
                ))}
            </TabsContent>

            {["error", "performance", "user_action", "api_call"].map((type) => (
              <TabsContent key={type} value={type} className="space-y-2 max-h-96 overflow-y-auto">
                {events
                  .filter((event) => event.type === type)
                  .slice(-50)
                  .reverse()
                  .map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getEventTypeColor(event.type) as any}>{event.type}</Badge>
                        <span className="font-medium">{event.message}</span>
                        {event.data && (
                          <pre className="text-xs bg-gray-100 p-1 rounded max-w-xs overflow-hidden">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{formatTimestamp(event.timestamp)}</span>
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default MonitoringDashboard
