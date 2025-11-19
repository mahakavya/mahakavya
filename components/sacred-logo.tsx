"use client"
import { cn } from "@/lib/utils"

interface SacredLogoProps {
  className?: string
  variant?: "icon" | "full"
  animated?: boolean
  size?: "sm" | "md" | "lg"
}

export function SacredLogo({ className, variant = "icon", animated = false }: SacredLogoProps) {
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            "w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg",
            animated && "animate-pulse",
          )}
        >
          <div className="text-white text-xl font-bold">卍</div>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Mahakavya
          </h1>
          <p className="text-xs text-gray-600">Social Platform</p>
        </div>
      </div>
    )
  }

  const sizeClass = className ?? (variant === "icon" ? "w-8 h-8" : "w-10 h-10")

  return (
    <div
      className={cn(
        `${sizeClass} bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center`,
        animated && "animate-pulse",
      )}
    >
      <div className="text-white text-lg font-bold">卍</div>
    </div>
  )
}
