"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  Plus,
  Settings,
  Crown,
  Shield,
  Bot,
  Zap,
  MessageSquare,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Lock,
  Globe,
  EyeOff,
  Activity,
} from "lucide-react"
import { GroupAnalytics } from "@/components/chat/GroupAnalytics"
import { AIGroupInsights } from "@/components/chat/AIGroupInsights"
import { BlockchainGroupStatus } from "@/components/chat/BlockchainGroupStatus"
import { RPAGroupStatus } from "@/components/chat/RPAGroupStatus"
import { GroupChatInterface } from "@/components/chat/GroupChatInterface"
import { AITopicSuggestions } from "@/components/chat/AITopicSuggestions"
import { AIMemberRecommendations } from "@/components/chat/AIMemberRecommendations"
import { BlockchainVerifyButton } from "@/components/chat/BlockchainVerifyButton"
import { RPAManageButton } from "@/components/chat/RPAManageButton"

interface Group {
  id: string
  name: string
  description: string
  avatar_url: string | null
  member_count: number
  privacy: "public" | "private" | "secret"
  created_at: string
  created_by: string
  is_admin: boolean
  last_activity: string
  ai_enabled: boolean
  blockchain_verified: boolean
  rpa_automated: boolean
  engagement_score: number
  category: string
}

interface GroupStats {
  total_groups: number
  active_groups: number
  total_members: number
  messages_today: number
  ai_insights_generated: number
  blockchain_verifications: number
  rpa_automations_active: number
}

export default function VartaGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [stats, setStats] = useState<GroupStats | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("groups")

  // New group form state
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    privacy: "private" as "public" | "private" | "secret",
    category: "",
    ai_enabled: true,
    blockchain_verified: true,
    rpa_automated: true,
    max_members: 50,
  })

  useEffect(() => {
    fetchGroups()
    fetchStats()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/chat/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/chat/groups/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleCreateGroup = async () => {
    try {
      const response = await fetch("/api/chat/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      })

      if (response.ok) {
        const createdGroup = await response.json()
        setGroups((prev) => [createdGroup, ...prev])
        setIsCreateDialogOpen(false)
        setNewGroup({
          name: "",
          description: "",
          privacy: "private",
          category: "",
          ai_enabled: true,
          blockchain_verified: true,
          rpa_automated: true,
          max_members: 50,
        })
      }
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/chat/groups/${groupId}/join`, {
        method: "POST",
      })

      if (response.ok) {
        fetchGroups()
      }
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === "all" || group.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "public":
        return <Globe className="h-4 w-4" />
      case "private":
        return <Lock className="h-4 w-4" />
      case "secret":
        return <EyeOff className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (selectedGroup) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedGroup(null)}>
              ← Back to Groups
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedGroup.avatar_url || ""} />
                <AvatarFallback>{selectedGroup.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{selectedGroup.name}</h1>
                <p className="text-muted-foreground">{selectedGroup.member_count} members</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedGroup.ai_enabled && (
              <Badge variant="secondary">
                <Bot className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
            {selectedGroup.blockchain_verified && (
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {selectedGroup.rpa_automated && (
              <Badge variant="secondary">
                <Zap className="h-3 w-3 mr-1" />
                Automated
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <GroupChatInterface group={selectedGroup} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Varta Groups</h1>
          <p className="text-muted-foreground">Premium group conversations with AI, Blockchain & RPA</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>Set up your premium group with advanced features</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your group"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="privacy">Privacy</Label>
                <Select
                  value={newGroup.privacy}
                  onValueChange={(value: any) => setNewGroup((prev) => ({ ...prev, privacy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can join</SelectItem>
                    <SelectItem value="private">Private - Invite only</SelectItem>
                    <SelectItem value="secret">Secret - Hidden from search</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newGroup.category}
                  onValueChange={(value) => setNewGroup((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Advanced Features</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm">AI Insights</span>
                  </div>
                  <Switch
                    checked={newGroup.ai_enabled}
                    onCheckedChange={(checked) => setNewGroup((prev) => ({ ...prev, ai_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Blockchain Verification</span>
                  </div>
                  <Switch
                    checked={newGroup.blockchain_verified}
                    onCheckedChange={(checked) => setNewGroup((prev) => ({ ...prev, blockchain_verified: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">RPA Automation</span>
                  </div>
                  <Switch
                    checked={newGroup.rpa_automated}
                    onCheckedChange={(checked) => setNewGroup((prev) => ({ ...prev, rpa_automated: checked }))}
                  />
                </div>
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Groups</p>
                  <p className="text-2xl font-bold">{stats.total_groups}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Today</p>
                  <p className="text-2xl font-bold">{stats.active_groups}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{stats.total_members}</p>
                </div>
                <UserPlus className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages Today</p>
                  <p className="text-2xl font-bold">{stats.messages_today}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url || ""} />
                        <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getPrivacyIcon(group.privacy)}
                          <span className="text-sm text-muted-foreground capitalize">{group.privacy}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{group.member_count} members</span>
                    <span className={`font-medium ${getEngagementColor(group.engagement_score)}`}>
                      {group.engagement_score}% engagement
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {group.ai_enabled && (
                      <Badge variant="secondary" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {group.blockchain_verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {group.rpa_automated && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                    {group.is_admin && (
                      <Badge variant="outline" className="text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setSelectedGroup(group)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                    {!group.is_admin && (
                      <Button variant="outline" size="sm" onClick={() => handleJoinGroup(group.id)}>
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {group.is_admin && <BlockchainVerifyButton groupId={group.id} />}
                    {group.is_admin && <RPAManageButton groupId={group.id} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredGroups.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search criteria" : "Create your first group to get started"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discover Groups</CardTitle>
              <CardDescription>Find and join public groups that match your interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Discover Feature</h3>
                <p className="text-muted-foreground">
                  Browse public groups, trending topics, and recommended communities
                </p>
              </div>
            </CardContent>
          </Card>
          <AITopicSuggestions />
          <AIMemberRecommendations />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <GroupAnalytics />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIGroupInsights />
            <div className="space-y-6">
              <BlockchainGroupStatus />
              <RPAGroupStatus />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
