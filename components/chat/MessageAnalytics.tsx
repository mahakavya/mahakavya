"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, MessageCircle, Clock, Users } from "lucide-react"

interface MessageAnalyticsProps {
  analytics: {
    totalMessages: number
    activeConversations: number
    responseTime: string
    engagementScore: number
  }
}

const hourlyData = [
  { hour: "00", messages: 12 },
  { hour: "01", messages: 8 },
  { hour: "02", messages: 5 },
  { hour: "03", messages: 3 },
  { hour: "04", messages: 4 },
  { hour: "05", messages: 7 },
  { hour: "06", messages: 15 },
  { hour: "07", messages: 25 },
  { hour: "08", messages: 35 },
  { hour: "09", messages: 42 },
  { hour: "10", messages: 38 },
  { hour: "11", messages: 45 },
  { hour: "12", messages: 52 },
  { hour: "13", messages: 48 },
  { hour: "14", messages: 55 },
  { hour: "15", messages: 49 },
  { hour: "16", messages: 43 },
  { hour: "17", messages: 38 },
  { hour: "18", messages: 35 },
  { hour: "19", messages: 32 },
  { hour: "20", messages: 28 },
  { hour: "21", messages: 25 },
  { hour: "22", messages: 20 },
  { hour: "23", messages: 15 },
]

const weeklyData = [
  { day: "Mon", sent: 145, received: 132 },
  { day: "Tue", sent: 167, received: 154 },
  { day: "Wed", sent: 189, received: 176 },
  { day: "Thu", sent: 156, received: 143 },
  { day: "Fri", sent: 198, received: 185 },
  { day: "Sat", sent: 134, received: 121 },
  { day: "Sun", sent: 123, received: 110 },
]

const conversationTypes = [
  { name: "Direct", value: 65, color: "#3b82f6" },
  { name: "Group", value: 25, color: "#10b981" },
  { name: "AI Assisted", value: 10, color: "#f59e0b" },
]

export function MessageAnalytics({ analytics }: MessageAnalyticsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Message Analytics
        </h3>
        <Badge variant="outline">Real-time</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{analytics.totalMessages}</div>
            <div className="text-xs text-gray-600">Total Messages</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{analytics.activeConversations}</div>
            <div className="text-xs text-gray-600">Active Chats</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{analytics.responseTime}</div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{analytics.engagementScore}%</div>
            <div className="text-xs text-gray-600">Engagement</div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Hourly Activity</CardTitle>
          <CardDescription className="text-xs">Messages sent throughout the day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="messages" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Weekly Trends</CardTitle>
          <CardDescription className="text-xs">Messages sent vs received</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversation Types */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Conversation Types</CardTitle>
          <CardDescription className="text-xs">Distribution of conversation types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={conversationTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {conversationTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center space-x-4 mt-2">
            {conversationTypes.map((type) => (
              <div key={type.name} className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: type.color }} />
                <span>
                  {type.name} ({type.value}%)
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="bg-white/60 backdrop-blur-md border-white/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Peak Activity Time</span>
              <span className="font-semibold text-blue-600">2:00 PM - 4:00 PM</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Most Active Day</span>
              <span className="font-semibold text-green-600">Friday</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Average Message Length</span>
              <span className="font-semibold text-purple-600">47 characters</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Response Rate</span>
              <span className="font-semibold text-orange-600">94%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/20">
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Your response time is 23% faster than average</div>
              <div>• Most engaging conversations happen on weekdays</div>
              <div>• AI assistance improved response quality by 15%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
