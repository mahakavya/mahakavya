"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SacredLogo } from "@/components/sacred-logo"
import { AnimatedBackground } from "@/components/animated-background"
import { FloatingElements } from "@/components/floating-elements"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Focus as Lotus, BookOpen, Users, Star, Heart, Brain, LogOut, Sparkles, Crown, Flame, Sun } from "lucide-react"

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: "🕉️ Farewell",
      description: "May your journey continue with wisdom and peace",
    })
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="text-center">
          <SacredLogo variant="full" className="mb-8" animated={true} />
          <div className="animate-pulse text-amber-700">Loading your sacred space...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const features = [
    {
      icon: Brain,
      title: "AI Spiritual Guide",
      description: "Receive personalized guidance from our AI guru",
      color: "from-blue-500 to-indigo-600",
      action: "Start Session",
    },
    {
      icon: BookOpen,
      title: "Sacred Texts",
      description: "Explore ancient scriptures and teachings",
      color: "from-amber-500 to-orange-600",
      action: "Browse Library",
    },
    {
      icon: Lotus,
      title: "Meditation",
      description: "Practice guided meditation and mindfulness",
      color: "from-green-500 to-teal-600",
      action: "Begin Practice",
    },
    {
      icon: Star,
      title: "Astrology",
      description: "Discover insights through celestial wisdom",
      color: "from-purple-500 to-pink-600",
      action: "View Chart",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect with fellow spiritual seekers",
      color: "from-rose-500 to-red-600",
      action: "Join Discussions",
    },
    {
      icon: Heart,
      title: "Wellness",
      description: "Holistic health and healing practices",
      color: "from-pink-500 to-rose-600",
      action: "Explore Wellness",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 relative overflow-hidden">
      <AnimatedBackground />
      <FloatingElements />

      {/* Header */}
      <header className="relative z-10 border-b border-amber-200/50 dark:border-amber-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <SacredLogo variant="icon" className="w-8 h-8 transition-transform group-hover:scale-110" />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Mahakavya
              </span>
              <p className="text-sm text-amber-700 dark:text-amber-300">Sacred Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Welcome, {user.name || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 transition-all duration-300 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="relative z-10 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              🕉️ Sacred Dashboard ॐ
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Welcome to your personal sanctuary of wisdom and spiritual growth
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <Crown className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">7</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">Days Active</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <Flame className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">12</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">Meditations</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <Sun className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">5</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">Texts Read</div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">89%</div>
                <div className="text-sm text-amber-600 dark:text-amber-400">Wellness Score</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Your Sacred Tools
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div
                    className={`inline-flex p-4 rounded-full bg-gradient-to-r ${feature.color} mb-4 shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-amber-800 dark:text-amber-200 group-hover:text-amber-900 dark:group-hover:text-amber-100 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className={`w-full bg-gradient-to-r ${feature.color} hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-white`}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {feature.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="relative z-10 py-12 px-4 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Recent Sacred Activities
          </h2>

          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-teal-600">
                    <Lotus className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Completed morning meditation</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Read Bhagavad Gita Chapter 2</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">Yesterday</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Checked daily horoscope</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
