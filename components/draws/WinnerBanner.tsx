"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"

interface WinnerBannerProps {
  show: boolean
}

export function WinnerBanner({ show }: WinnerBannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setIsVisible(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
        <Trophy className="h-5 w-5" />
        <span className="font-bold">Winner Announced!</span>
        <div className="confetti">🎉</div>
      </div>
    </div>
  )
}
