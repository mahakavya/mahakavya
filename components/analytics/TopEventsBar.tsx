"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TopEventsBarProps {
  data: Array<{ name: string; cnt: number }>
}

export function TopEventsBar({ data }: TopEventsBarProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} aria-label="Top events" role="img">
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickFormatter={(value) => {
              // Format event names for display
              return value.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => {
              return (value as string).replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
            }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="cnt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
