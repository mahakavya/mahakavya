"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { aiService, type AIContext } from "@/lib/ai-service"

interface AIContextProviderProps {
  children: React.ReactNode
}

interface AIContextValue {
  context: AIContext | null
  updateContext: (context: Partial<AIContext>) => void
}

const AIContextContext = createContext<AIContextValue | null>(null)

export function AIContextProvider({ children }: AIContextProviderProps) {
  const pathname = usePathname()
  const [context, setContext] = useState<AIContext | null>(null)

  useEffect(() => {
    // Determine page context from pathname
    const getPageFromPath = (path: string): string => {
      if (path === "/") return "home"
      if (path.startsWith("/dashboard")) return "community"
      if (path.startsWith("/varta")) return "stories"
      if (path.startsWith("/samvaaha")) return "messages"
      if (path.startsWith("/sahaya")) return "support"
      if (path.startsWith("/nivedana")) return "fundraising"
      if (path.startsWith("/bhagyachakra")) return "draws"
      if (path.startsWith("/admin")) return "admin"
      if (path.startsWith("/settings")) return "settings"
      if (path.startsWith("/billing")) return "billing"
      if (path.startsWith("/search")) return "search"
      if (path.startsWith("/notifications")) return "notifications"
      return "other"
    }

    const newContext: AIContext = {
      page: getPageFromPath(pathname),
      path: pathname,
    }

    setContext(newContext)
    aiService.setContext(newContext)
  }, [pathname])

  const updateContext = (updates: Partial<AIContext>) => {
    if (context) {
      const newContext = { ...context, ...updates }
      setContext(newContext)
      aiService.setContext(newContext)
    }
  }

  return <AIContextContext.Provider value={{ context, updateContext }}>{children}</AIContextContext.Provider>
}

export function useAIContext() {
  const context = useContext(AIContextContext)
  if (!context) {
    throw new Error("useAIContext must be used within an AIContextProvider")
  }
  return context
}
