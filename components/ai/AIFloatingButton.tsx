"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bot, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIFloatingButtonProps {
  onClick: () => void
  isActive?: boolean
}

export function AIFloatingButton({ onClick, isActive }: AIFloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg transition-all duration-300",
        "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
        "border-2 border-white/20 backdrop-blur-sm",
        isActive && "scale-110 shadow-xl",
        isHovered && "scale-105",
      )}
      size="lg"
    >
      <div className="relative">
        <Bot className={cn("w-6 h-6 text-white transition-transform", isHovered && "scale-110")} />
        <Sparkles
          className={cn(
            "w-4 h-4 absolute -top-2 -right-2 text-yellow-300 transition-all",
            isActive ? "animate-pulse" : "animate-bounce",
          )}
        />
      </div>
    </Button>
  )
}
