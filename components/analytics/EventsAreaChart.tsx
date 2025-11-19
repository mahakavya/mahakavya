"use client"

import { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface EventsAreaChartProps {
  data: Array<{ day_ist: string; name: string; cnt: number }>
}

export function EventsAreaChart({ data }: EventsAreaChartProps) {
  const chartData = useMemo(() => {
    // Transform data to wide format with top 3 events
    const eventCounts = data.reduce(
      (acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.cnt
        return acc
      },
      {} as Record<string, number>,
    )

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name)

    const dayMap = new Map<string, Record<string, number>>()

    data.forEach((item) => {
      if (topEvents.includes(item.name)) {
        if (!dayMap.has(item.day_ist)) {
          dayMap.set(item.day_ist, { day: item.day_ist })
        }
        const dayData = dayMap.get(item.day_ist)!
        dayData[item.name] = item.cnt
      }
    })

    return Array.from(dayMap.values()).sort((a, b) => a.day.localeCompare(b.day))
  }, [data])

  const colors = ["#3b82f6", "#10b981", "#f59e0b"]

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          aria-label="Events over time"
          role="img"
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => {
              const date = new Date(value as string)
              return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
          />
          <Legend />
          {Object.keys(chartData[0] || {})
            .filter((key) => key !== "day")
            .map((eventName, index) => (
              <Area
                key={eventName}
                type="monotone"
                dataKey={eventName}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
