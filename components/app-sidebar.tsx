"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Video,
  MessageCircle,
  Heart,
  Gift,
  Coins,
  Settings,
  Bell,
  Search,
  Crown,
  LogOut,
  Focus as Lotus,
  BookOpen,
  Calendar,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { SacredLogo } from "./sacred-logo"

const navigation = [
  {
    name: "Sacred Home",
    href: "/",
    icon: Home,
    emoji: "🏠",
    sanskrit: "गृहम्",
  },
  {
    name: "समवाह (Community)",
    href: "/samvaaha",
    icon: Users,
    emoji: "🤝",
    sanskrit: "समुदायः",
  },
  {
    name: "दृश्य (Stories)",
    href: "/drishya",
    icon: Video,
    emoji: "📱",
    sanskrit: "कथाः",
  },
  {
    name: "वार्ता (Messages)",
    href: "/varta",
    icon: MessageCircle,
    emoji: "💬",
    sanskrit: "संदेशाः",
  },
  {
    name: "सहाय (Support)",
    href: "/sahaya",
    icon: Heart,
    emoji: "🤗",
    sanskrit: "सहायता",
  },
  {
    name: "निवेदन (Causes)",
    href: "/nivedana",
    icon: Gift,
    emoji: "🎁",
    sanskrit: "दानम्",
  },
  {
    name: "भाग्यचक्र (Draws)",
    href: "/bhagyachakra",
    icon: Coins,
    emoji: "🎯",
    sanskrit: "भाग्यम्",
  },
]

const secondaryNavigation = [
  {
    name: "Sacred Search",
    href: "/search",
    icon: Search,
    emoji: "🔍",
    sanskrit: "खोजः",
  },
  {
    name: "Divine Notifications",
    href: "/notifications",
    icon: Bell,
    emoji: "🔔",
    sanskrit: "सूचनाः",
  },
  {
    name: "Sacred Settings",
    href: "/settings",
    icon: Settings,
    emoji: "⚙️",
    sanskrit: "सेटिंग्स",
  },
]

const spiritualNavigation = [
  {
    name: "Vedic Wisdom",
    href: "/wisdom",
    icon: BookOpen,
    emoji: "📚",
    sanskrit: "ज्ञानम्",
  },
  {
    name: "Sacred Calendar",
    href: "/calendar",
    icon: Calendar,
    emoji: "📅",
    sanskrit: "कैलेंडर",
  },
  {
    name: "Spiritual Growth",
    href: "/spiritual",
    icon: Lotus,
    emoji: "🪷",
    sanskrit: "आध्यात्म",
  },
  {
    name: "Divine Guidance",
    href: "/guidance",
    icon: Star,
    emoji: "⭐",
    sanskrit: "मार्गदर्शन",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, isAdmin, signOut } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col sacred-card border-r-2 border-amber-300">
      {/* Sacred Logo Header */}
      <div className="flex h-20 items-center justify-center px-6 border-b-2 border-amber-300 bg-gradient-to-r from-amber-100 to-orange-100">
        <Link href="/" className="flex items-center justify-center">
          <SacredLogo variant="simple" size="md" />
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        {/* Sacred Greeting */}
        <div className="text-center mb-6 py-3 sacred-card rounded-lg">
          <div className="text-sm text-amber-700 font-devanagari font-bold">🙏 नमस्कार 🙏</div>
          <div className="text-xs text-amber-600 mt-1">🕉️ ॐ गं गणपतये नमः ॐ 🕉️</div>
        </div>

        {/* Main Navigation */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Sacred Navigation</h3>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 group",
                  isActive
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg divine-glow"
                    : "text-amber-800 hover:bg-amber-100 hover:text-amber-900 hover:scale-105",
                )}
              >
                <span className="text-lg group-hover:animate-bounce">{item.emoji}</span>
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75 font-devanagari">{item.sanskrit}</div>
                </div>
              </Link>
            )
          })}
        </div>

        <Separator className="my-4 bg-amber-300" />

        {/* Spiritual Navigation */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Spiritual Path</h3>
          {spiritualNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 group",
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg divine-glow"
                    : "text-amber-800 hover:bg-purple-100 hover:text-purple-900 hover:scale-105",
                )}
              >
                <span className="text-lg group-hover:animate-bounce">{item.emoji}</span>
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75 font-devanagari">{item.sanskrit}</div>
                </div>
              </Link>
            )
          })}
        </div>

        <Separator className="my-4 bg-amber-300" />

        {/* Secondary Navigation */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Sacred Tools</h3>
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 group",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg divine-glow"
                    : "text-amber-800 hover:bg-blue-100 hover:text-blue-900 hover:scale-105",
                )}
              >
                <span className="text-lg group-hover:animate-bounce">{item.emoji}</span>
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75 font-devanagari">{item.sanskrit}</div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Separator className="my-4 bg-amber-300" />
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Divine Admin</h3>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-300 group",
                  pathname.startsWith("/admin")
                    ? "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg divine-glow"
                    : "text-amber-800 hover:bg-red-100 hover:text-red-900 hover:scale-105",
                )}
              >
                <span className="text-lg group-hover:animate-bounce">👑</span>
                <Crown className="h-5 w-5" />
                <div className="flex-1">
                  <div className="font-medium">Sacred Console</div>
                  <div className="text-xs opacity-75 font-devanagari">प्रशासन</div>
                </div>
              </Link>
            </div>
          </>
        )}
      </ScrollArea>

      {/* Sacred User Section */}
      {user && (
        <div className="border-t-2 border-amber-300 p-4 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg divine-glow">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 truncate">{user.email}</p>
              <p className="text-xs text-amber-700 font-devanagari font-medium">🪷 स्वागतम् 🪷</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start text-amber-800 hover:text-red-700 hover:bg-red-50 transition-all duration-300 font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sacred Logout
          </Button>
        </div>
      )}
    </div>
  )
}
