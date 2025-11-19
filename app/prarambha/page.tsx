"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Heart,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  Bot,
  Lock,
  Cog,
  Globe,
  Zap,
  Play,
  MessageCircle,
  Video,
  Headphones,
  Gift,
  CheckCircle,
  Clock,
  Award,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import { SacredLogo } from "@/components/sacred-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { FloatingElements } from "@/components/floating-elements"
import { aiService } from "@/lib/ai-service"

interface PlatformStats {
  total_users: number
  active_campaigns: number
  funds_raised: number
  success_rate: number
  ai_interactions: number
  blockchain_transactions: number
  rpa_automations: number
  content_created: number
  communities_formed: number
  wellness_sessions: number
}

interface AIGreeting {
  message: string
  personalized: boolean
  timestamp: string
}

interface FeatureStatus {
  name: string
  status: "live" | "beta" | "coming-soon"
  users: number
  description: string
  icon: any
  category: "social" | "wellness" | "finance" | "entertainment"
  aiPowered: boolean
  blockchainSecured: boolean
  rpaAutomated: boolean
}

export default function PrarambhaPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [aiGreeting, setAiGreeting] = useState<AIGreeting | null>(null)
  const [features, setFeatures] = useState<FeatureStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [userEngagement, setUserEngagement] = useState({
    timeOnPage: 0,
    sectionsViewed: new Set<string>(),
    interactionsCount: 0,
  })

  useEffect(() => {
    loadPlatformData()
    generateAIGreeting()
    trackUserEngagement()

    // Track time on page
    const startTime = Date.now()
    const interval = setInterval(() => {
      setUserEngagement((prev) => ({
        ...prev,
        timeOnPage: Math.floor((Date.now() - startTime) / 1000),
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const loadPlatformData = async () => {
    try {
      const [statsResponse, featuresResponse] = await Promise.all([
        fetch("/api/platform/stats"),
        fetch("/api/platform/features"),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json()
        setFeatures(featuresData.features)
      }
    } catch (error) {
      console.error("Failed to load platform data:", error)
      // Set fallback data
      setStats({
        total_users: 12847,
        active_campaigns: 234,
        funds_raised: 5847500,
        success_rate: 0.89,
        ai_interactions: 156000,
        blockchain_transactions: 45000,
        rpa_automations: 128000,
        content_created: 89000,
        communities_formed: 1200,
        wellness_sessions: 8900,
      })

      setFeatures([
        {
          name: "Samvaaha",
          status: "live",
          users: 8500,
          description: "AI-curated social feed with meaningful connections",
          icon: Globe,
          category: "social",
          aiPowered: true,
          blockchainSecured: true,
          rpaAutomated: true,
        },
        {
          name: "Drishya",
          status: "live",
          users: 6200,
          description: "Short-form videos with AI content analysis",
          icon: Video,
          category: "entertainment",
          aiPowered: true,
          blockchainSecured: false,
          rpaAutomated: true,
        },
        {
          name: "Nivedana",
          status: "live",
          users: 3400,
          description: "Blockchain-secured fundraising campaigns",
          icon: Heart,
          category: "finance",
          aiPowered: true,
          blockchainSecured: true,
          rpaAutomated: true,
        },
        {
          name: "Sahaya",
          status: "beta",
          users: 1800,
          description: "AI-assisted wellness and mental health support",
          icon: Headphones,
          category: "wellness",
          aiPowered: true,
          blockchainSecured: false,
          rpaAutomated: true,
        },
        {
          name: "BhagyaChakra",
          status: "live",
          users: 4500,
          description: "Gamified rewards with blockchain transparency",
          icon: Gift,
          category: "entertainment",
          aiPowered: false,
          blockchainSecured: true,
          rpaAutomated: true,
        },
        {
          name: "Varta",
          status: "coming-soon",
          users: 0,
          description: "End-to-end encrypted messaging platform",
          icon: MessageCircle,
          category: "social",
          aiPowered: true,
          blockchainSecured: true,
          rpaAutomated: false,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIGreeting = async () => {
    try {
      const greeting = await aiService.getWelcomeMessage()
      setAiGreeting({
        message: greeting,
        personalized: true,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to generate AI greeting:", error)
      setAiGreeting({
        message:
          "🙏 Namaste! Welcome to Mahakavya, where ancient wisdom meets modern innovation. Discover a platform that honors Sanskrit heritage while embracing cutting-edge technology.",
        personalized: false,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const trackUserEngagement = () => {
    // Track scroll events to see which sections are viewed
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setUserEngagement((prev) => ({
              ...prev,
              sectionsViewed: new Set([...prev.sectionsViewed, entry.target.id]),
            }))
          }
        })
      },
      { threshold: 0.5 },
    )

    // Observe all major sections
    const sections = document.querySelectorAll("[data-section]")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }

  const handleInteraction = (action: string) => {
    setUserEngagement((prev) => ({
      ...prev,
      interactionsCount: prev.interactionsCount + 1,
    }))

    // Send engagement data to RPA service
    fetch("/api/rpa/track-engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        page: "prarambha",
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error)
  }

  const getFeaturesByCategory = (category: string) => {
    return features.filter((feature) => feature.category === category)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50">
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <SacredLogo className="w-32 h-32 mx-auto mb-8 animate-pulse" />
            <div className="text-2xl font-bold text-gray-700 mb-4">प्रारम्भ</div>
            <div className="text-lg text-gray-600">Loading your journey...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50">
      <AnimatedBackground />
      <FloatingElements />

      <div className="relative z-10">
        {/* Hero Section */}
        <section id="hero" data-section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <SacredLogo className="w-32 h-32 mx-auto mb-8 animate-bounce" />
              <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 text-lg mb-6">
                <Sparkles className="h-5 w-5 mr-2" />
                प्रारम्भ - The Sacred Beginning
              </Badge>

              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent mb-6">
                महाकाव्य
              </h1>

              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Where Ancient Wisdom Meets Modern Innovation
              </h2>

              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                Join India's most advanced social platform powered by Generative AI, secured by Blockchain, and
                automated by RPA. Create meaningful connections, support noble causes, and be part of a community that
                honors our Sanskrit heritage while embracing the future.
              </p>

              {/* AI Greeting Card */}
              {aiGreeting && (
                <Card className="glass max-w-3xl mx-auto mb-8">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Bot className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">AI-Powered Welcome Message</span>
                    </div>
                    <p className="text-lg text-gray-700 leading-relaxed">{aiGreeting.message}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 text-lg shadow-xl"
                onClick={() => handleInteraction("signup_click")}
                asChild
              >
                <Link href="/signup">
                  Begin Your Journey
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg bg-white/80 backdrop-blur-sm"
                onClick={() => handleInteraction("signin_click")}
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Platform Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
                <Card className="glass text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-4">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.total_users.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                    <div className="text-xs text-green-600 mt-1">+12% this week</div>
                  </CardContent>
                </Card>

                <Card className="glass text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-4">
                    <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.active_campaigns.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Live Campaigns</div>
                    <div className="text-xs text-green-600 mt-1">+8% this month</div>
                  </CardContent>
                </Card>

                <Card className="glass text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-4">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">₹{(stats.funds_raised / 100000).toFixed(1)}L</div>
                    <div className="text-sm text-gray-600">Funds Raised</div>
                    <div className="text-xs text-green-600 mt-1">+25% this quarter</div>
                  </CardContent>
                </Card>

                <Card className="glass text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-4">
                    <Bot className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{(stats.ai_interactions / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-gray-600">AI Interactions</div>
                    <div className="text-xs text-blue-600 mt-1">Real-time</div>
                  </CardContent>
                </Card>

                <Card className="glass text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-4">
                    <Shield className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{Math.round(stats.success_rate * 100)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                    <div className="text-xs text-green-600 mt-1">Industry leading</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Technology Showcase */}
        <section id="technology" data-section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Powered by Next-Generation Technology</h3>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of social networking with our revolutionary integration of AI, Blockchain, and RPA
                technologies
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mb-6 shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Generative AI</CardTitle>
                  <Badge className="bg-purple-100 text-purple-800">GPT-4 Powered</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-gray-600 leading-relaxed">
                    Advanced AI algorithms provide personalized content recommendations, intelligent moderation, smart
                    user matching, and contextual assistance throughout your journey.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Content Curation
                      </span>
                      <span className="font-medium">98.5%</span>
                    </div>
                    <Progress value={98.5} className="h-2" />

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        User Matching
                      </span>
                      <span className="font-medium">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleInteraction("ai_learn_more")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Blockchain Security</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800">Web3 Ready</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-gray-600 leading-relaxed">
                    Immutable identity verification, secure transactions, decentralized reputation system, and
                    transparent audit trails ensure maximum security and trust.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-blue-600" />
                        Security Score
                      </span>
                      <span className="font-medium">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Transactions Verified
                      </span>
                      <span className="font-medium">{stats?.blockchain_transactions.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleInteraction("blockchain_learn_more")}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Explore Security
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                    <Cog className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">RPA Automation</CardTitle>
                  <Badge className="bg-green-100 text-green-800">Smart Automation</Badge>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-gray-600 leading-relaxed">
                    Intelligent automation handles routine tasks, content moderation, user onboarding, and system
                    maintenance for a seamless, friction-free experience.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        Automation Rate
                      </span>
                      <span className="font-medium">96.8%</span>
                    </div>
                    <Progress value={96.8} className="h-2" />

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Tasks Automated
                      </span>
                      <span className="font-medium">
                        {stats ? (stats.rpa_automations / 1000).toFixed(0) + "K" : "128K"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => handleInteraction("rpa_learn_more")}
                  >
                    <Cog className="h-4 w-4 mr-2" />
                    See Automation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section id="features" data-section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Comprehensive Platform Features</h3>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Explore our suite of interconnected features designed to create meaningful connections and positive
                impact
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-7xl mx-auto">
              <TabsList className="grid w-full grid-cols-4 mb-12">
                <TabsTrigger value="overview" className="text-lg py-3">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="social" className="text-lg py-3">
                  Social
                </TabsTrigger>
                <TabsTrigger value="wellness" className="text-lg py-3">
                  Wellness
                </TabsTrigger>
                <TabsTrigger value="finance" className="text-lg py-3">
                  Finance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <Card key={feature.name} className="glass hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <feature.icon className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge
                              className={
                                feature.status === "live"
                                  ? "bg-green-100 text-green-800"
                                  : feature.status === "beta"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {feature.status.replace("-", " ")}
                            </Badge>
                            {feature.status === "live" && (
                              <Badge className="bg-gray-100 text-gray-800 text-xs">
                                {feature.users.toLocaleString()} users
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-xl mb-2">{feature.name}</CardTitle>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Technology Stack:</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {feature.aiPowered && (
                              <Badge variant="outline" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            {feature.blockchainSecured && (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Blockchain
                              </Badge>
                            )}
                            {feature.rpaAutomated && (
                              <Badge variant="outline" className="text-xs">
                                <Cog className="h-3 w-3 mr-1" />
                                RPA
                              </Badge>
                            )}
                          </div>
                          <Button
                            className="w-full"
                            variant={feature.status === "live" ? "default" : "outline"}
                            onClick={() => handleInteraction(`feature_${feature.name.toLowerCase()}_click`)}
                            asChild={feature.status === "live"}
                          >
                            {feature.status === "live" ? (
                              <Link href={`/${feature.name.toLowerCase()}`}>
                                <Play className="h-4 w-4 mr-2" />
                                Try Now
                              </Link>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                {feature.status === "beta" ? "Join Beta" : "Coming Soon"}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="social" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {getFeaturesByCategory("social").map((feature) => (
                    <Card key={feature.name} className="glass hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <feature.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{feature.name}</CardTitle>
                            <Badge
                              className={
                                feature.status === "live"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {feature.status.replace("-", " ")}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {feature.status === "live" && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Active Users:</span>
                              <span className="font-semibold">{feature.users.toLocaleString()}</span>
                            </div>
                          )}
                          <Button
                            className="w-full"
                            onClick={() => handleInteraction(`social_${feature.name.toLowerCase()}_click`)}
                            asChild={feature.status === "live"}
                          >
                            {feature.status === "live" ? (
                              <Link href={`/${feature.name.toLowerCase()}`}>Explore {feature.name}</Link>
                            ) : (
                              <>Coming Soon</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="wellness" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {getFeaturesByCategory("wellness").map((feature) => (
                    <Card key={feature.name} className="glass hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
                            <feature.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{feature.name}</CardTitle>
                            <Badge className="bg-blue-100 text-blue-800">{feature.status}</Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-teal-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Headphones className="h-5 w-5 text-teal-600" />
                              <span className="font-medium text-teal-800">Wellness Features</span>
                            </div>
                            <ul className="text-sm text-teal-700 space-y-1">
                              <li>• AI-powered mood tracking</li>
                              <li>• Professional listener network</li>
                              <li>• Personalized wellness plans</li>
                              <li>• Crisis intervention support</li>
                            </ul>
                          </div>
                          <Button
                            className="w-full bg-teal-600 hover:bg-teal-700"
                            onClick={() => handleInteraction(`wellness_${feature.name.toLowerCase()}_click`)}
                            asChild
                          >
                            <Link href={`/${feature.name.toLowerCase()}`}>Get Support</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="finance" className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {getFeaturesByCategory("finance").map((feature) => (
                    <Card key={feature.name} className="glass hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <feature.icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">{feature.name}</CardTitle>
                            <Badge className="bg-green-100 text-green-800">{feature.status}</Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-5 w-5 text-green-600" />
                              <span className="font-medium text-green-800">Security Features</span>
                            </div>
                            <ul className="text-sm text-green-700 space-y-1">
                              <li>• Blockchain transaction verification</li>
                              <li>• Smart contract automation</li>
                              <li>• Transparent fund tracking</li>
                              <li>• Automated compliance checks</li>
                            </ul>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Total Raised:</span>
                            <span className="font-semibold text-green-600">
                              ₹{stats ? (stats.funds_raised / 100000).toFixed(1) : "58.5"}L+
                            </span>
                          </div>
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleInteraction(`finance_${feature.name.toLowerCase()}_click`)}
                            asChild
                          >
                            <Link href={`/${feature.name.toLowerCase()}`}>Start Campaign</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Platform Access Section */}
        <section id="access" data-section className="py-20 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-3xl p-12 shadow-2xl">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Multiple Ways to Access Mahakavya</h3>
                <p className="text-xl text-gray-600">Choose your preferred platform and start your journey today</p>
              </div>

              <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                <div className="text-center group cursor-pointer" onClick={() => handleInteraction("web_access_click")}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Web Platform</h4>
                  <p className="text-gray-600 text-sm mb-2">Full-featured web experience</p>
                  <Badge className="bg-green-100 text-green-800">Available Now</Badge>
                </div>

                <div
                  className="text-center group cursor-pointer"
                  onClick={() => handleInteraction("mobile_access_click")}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Mobile App</h4>
                  <p className="text-gray-600 text-sm mb-2">Native iOS & Android apps</p>
                  <Badge className="bg-blue-100 text-blue-800">Coming Soon</Badge>
                </div>

                <div className="text-center group cursor-pointer" onClick={() => handleInteraction("pwa_access_click")}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">PWA</h4>
                  <p className="text-gray-600 text-sm mb-2">Progressive Web App</p>
                  <Badge className="bg-green-100 text-green-800">Install Ready</Badge>
                </div>

                <div className="text-center group cursor-pointer" onClick={() => handleInteraction("api_access_click")}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Cog className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Developer API</h4>
                  <p className="text-gray-600 text-sm mb-2">Build with our platform</p>
                  <Badge className="bg-yellow-100 text-yellow-800">Beta Access</Badge>
                </div>
              </div>

              <div className="text-center mt-12">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 text-lg"
                  onClick={() => handleInteraction("get_started_click")}
                  asChild
                >
                  <Link href="/signup">
                    Get Started Today
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section id="cta" data-section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 text-white border-0 shadow-2xl">
              <CardContent className="text-center py-16 px-8">
                <h3 className="text-4xl md:text-5xl font-bold mb-6">Ready to Begin Your Mahakavya?</h3>
                <p className="text-xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-90">
                  Join thousands of users who are already making a difference through our platform. Experience the
                  perfect blend of ancient wisdom and modern technology.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                  <Button
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg shadow-xl"
                    onClick={() => handleInteraction("final_signup_click")}
                    asChild
                  >
                    <Link href="/signup">
                      Create Your Account
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg bg-transparent"
                    onClick={() => handleInteraction("view_plans_click")}
                    asChild
                  >
                    <Link href="/yojana">View Plans</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-8 text-sm opacity-75">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Free to Start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span>Award Winning</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Engagement Tracking Display (for demo purposes) */}
        {process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs">
            <div>Time on page: {userEngagement.timeOnPage}s</div>
            <div>Sections viewed: {userEngagement.sectionsViewed.size}</div>
            <div>Interactions: {userEngagement.interactionsCount}</div>
          </div>
        )}
      </div>
    </div>
  )
}
