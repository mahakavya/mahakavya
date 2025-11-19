"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  UserPlus,
  Crown,
  IndianRupee,
  Flag,
  Heart,
  TrendingUp,
  FileText,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KpiCard } from "@/components/admin/KpiCard"
import { TrendChart } from "@/components/admin/TrendChart"
import { ModerationTable } from "@/components/admin/ModerationTable"
import { AuditList } from "@/components/admin/AuditList"
import { useAdminMetrics, useUsageTrend } from "@/hooks/useAdminData"
import { summarizeInsights } from "./_actions"
import { toast } from "sonner"

export function AdminDashboard() {
  const [aiInsights, setAiInsights] = useState<string>("")
  const [loadingInsights, setLoadingInsights] = useState(false)

  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics()
  const { data: usageTrend, isLoading: trendLoading } = useUsageTrend(30)

  const handleGenerateInsights = async () => {
    setLoadingInsights(true)
    try {
      const insights = await summarizeInsights()
      setAiInsights(insights)
      toast.success("AI insights generated successfully")
    } catch (error) {
      toast.error("Failed to generate insights")
    } finally {
      setLoadingInsights(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">नियंत्रण — Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Platform oversight and management</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Admin Access
              </Badge>
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <KpiCard title="Daily Active Users" value={metrics?.dau_today || 0} icon={Users} loading={metricsLoading} />
          <KpiCard
            title="New Signups"
            value={metrics?.new_signups_today || 0}
            icon={UserPlus}
            loading={metricsLoading}
          />
          <KpiCard title="Premium Active" value={metrics?.premium_active || 0} icon={Crown} loading={metricsLoading} />
          <KpiCard
            title="Estimated MRR"
            value={metrics?.total_revenue_est || 0}
            icon={IndianRupee}
            loading={metricsLoading}
            format="currency"
          />
          <KpiCard title="Open Flags" value={metrics?.open_flags || 0} icon={Flag} loading={metricsLoading} />
          <KpiCard
            title="Active Fundraisers"
            value={metrics?.active_fundraisers || 0}
            icon={Heart}
            loading={metricsLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TrendChart
            title="Daily Active Users (30 Days)"
            data={usageTrend || []}
            loading={trendLoading}
            type="line"
            dataKeys={["dau"]}
            colors={["#3b82f6"]}
          />
          <TrendChart
            title="Content Activity (30 Days)"
            data={usageTrend || []}
            loading={trendLoading}
            type="bar"
            dataKeys={["posts", "reels", "messages"]}
            colors={["#10b981", "#f59e0b", "#ef4444"]}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Moderation */}
          <div className="lg:col-span-2">
            <ModerationTable />
          </div>

          {/* Right Column - AI Insights & Audit */}
          <div className="space-y-6">
            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={loadingInsights}
                    className="w-full mb-4 bg-transparent"
                    variant="outline"
                  >
                    {loadingInsights ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    Summarize Last 7 Days
                  </Button>
                  {aiInsights && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{aiInsights}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Audit Log */}
            <AuditList />
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <Flag className="h-5 w-5" />
                  <span className="text-xs">Content Control</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <Users className="h-5 w-5" />
                  <span className="text-xs">Users</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <Heart className="h-5 w-5" />
                  <span className="text-xs">Fundraising</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Analytics</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">AI Insights</span>
                </Button>
                <Button variant="outline" className="flex flex-col h-20 gap-2 bg-transparent">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
