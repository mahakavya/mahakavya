"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, Search, Shield, Brain, Zap, AlertTriangle, CheckCircle } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  status: "active" | "suspended" | "pending"
  joinDate: string
  lastActive: string
  riskScore: number
  verified: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [automating, setAutomating] = useState(false)

  useEffect(() => {
    // Simulate fetching users
    const mockUsers: User[] = [
      {
        id: "1",
        email: "alice@example.com",
        name: "Alice Johnson",
        status: "active",
        joinDate: "2024-01-15",
        lastActive: new Date().toISOString(),
        riskScore: 0.1,
        verified: true,
      },
      {
        id: "2",
        email: "bob@example.com",
        name: "Bob Smith",
        status: "active",
        joinDate: "2024-02-20",
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        riskScore: 0.3,
        verified: true,
      },
      {
        id: "3",
        email: "charlie@example.com",
        name: "Charlie Brown",
        status: "pending",
        joinDate: "2024-03-10",
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        riskScore: 0.8,
        verified: false,
      },
    ]

    setUsers(mockUsers)
    setLoading(false)
  }, [])

  const analyzeUserBehavior = async () => {
    setAnalyzing(true)
    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Update risk scores
    const updatedUsers = users.map((user) => ({
      ...user,
      riskScore: Math.random(),
    }))
    setUsers(updatedUsers)
    setAnalyzing(false)
  }

  const verifyUserIdentities = async () => {
    setVerifying(true)
    // Simulate blockchain verification
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Update verification status
    const updatedUsers = users.map((user) => ({
      ...user,
      verified: Math.random() > 0.2,
    }))
    setUsers(updatedUsers)
    setVerifying(false)
  }

  const automateUserManagement = async () => {
    setAutomating(true)
    // Simulate RPA automation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Auto-suspend high risk users
    const updatedUsers = users.map((user) => ({
      ...user,
      status: user.riskScore > 0.7 ? ("suspended" as const) : user.status,
    }))
    setUsers(updatedUsers)
    setAutomating(false)
  }

  const handleUserManagement = async () => {
    await Promise.all([analyzeUserBehavior(), verifyUserIdentities(), automateUserManagement()])
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      suspended: "destructive" as const,
      pending: "secondary" as const,
    }
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>
  }

  const getRiskColor = (score: number) => {
    if (score > 0.7) return "text-red-600"
    if (score > 0.4) return "text-yellow-600"
    return "text-green-600"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">AI behavior analysis, blockchain verification, and RPA automation</p>
        </div>
        <Button onClick={handleUserManagement} disabled={analyzing || verifying || automating}>
          {analyzing || verifying || automating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Analyze All Users
            </>
          )}
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{users.filter((u) => u.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Verified Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{users.filter((u) => u.verified).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{users.filter((u) => u.riskScore > 0.7).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Search & Management</CardTitle>
          <CardDescription>Search users and perform AI-powered analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={analyzeUserBehavior} disabled={analyzing} variant="outline">
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  AI Behavior Analysis
                </>
              )}
            </Button>

            <Button onClick={verifyUserIdentities} disabled={verifying} variant="outline">
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Blockchain Verification
                </>
              )}
            </Button>

            <Button onClick={automateUserManagement} disabled={automating} variant="outline">
              {automating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Automating...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  RPA Automation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>User accounts with AI risk analysis and verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  {getStatusIcon(user.status)}
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Joined: {new Date(user.joinDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Last active: {new Date(user.lastActive).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(user.status)}
                    {user.verified && <Badge variant="outline">Verified</Badge>}
                  </div>
                  <div className="text-xs">
                    Risk Score:{" "}
                    <span className={getRiskColor(user.riskScore)}>{(user.riskScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
