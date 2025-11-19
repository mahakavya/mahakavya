"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { motion } from "framer-motion"

interface TrendChartProps {
  title: string
  data: any[]
  loading?: boolean
  type?: "line" | "bar"
  dataKeys: string[]
  colors?: string[]
}

export function TrendChart({
  title,
  data,
  loading = false,
  type = "line",
  dataKeys,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
}: TrendChartProps) {
  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="usage_date" tickFormatter={formatDate} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="usage_date" tickFormatter={formatDate} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                {dataKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
