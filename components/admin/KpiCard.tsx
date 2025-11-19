"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  loading?: boolean
  format?: "number" | "currency" | "percentage"
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function KpiCard({ title, value, icon: Icon, loading = false, format = "number", trend }: KpiCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === "string") return val

    switch (format) {
      case "currency":
        return `₹${val.toLocaleString("en-IN")}`
      case "percentage":
        return `${val}%`
      default:
        return val.toLocaleString("en-IN")
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="relative overflow-hidden backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">{formatValue(value)}</div>
              {trend && (
                <p className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}% from last period
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
