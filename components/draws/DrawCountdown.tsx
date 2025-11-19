"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface DrawCountdownProps {
  drawAt: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function DrawCountdown({ drawAt, onComplete }: DrawCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft | null => {
      const difference = new Date(drawAt).getTime() - new Date().getTime()

      if (difference <= 0) {
        if (!isComplete) {
          setIsComplete(true)
          onComplete?.()
        }
        return null
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Set up interval only if not complete
    if (!isComplete) {
      const timer = setInterval(() => {
        const newTimeLeft = calculateTimeLeft()
        setTimeLeft(newTimeLeft)
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [drawAt, isComplete, onComplete])

  if (isComplete || !timeLeft) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <Clock className="h-5 w-5" />
        <span className="font-medium">Draw time reached</span>
      </div>
    )
  }

  const isClosingSoon = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 10

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-gray-700">
        <Clock className="h-5 w-5" />
        <span className="font-medium">Time remaining:</span>
      </div>

      <div className={`grid grid-cols-4 gap-2 ${isClosingSoon ? "text-red-600" : "text-gray-900"}`} aria-live="polite">
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.days}</div>
          <div className="text-xs text-gray-500">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.hours}</div>
          <div className="text-xs text-gray-500">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.minutes}</div>
          <div className="text-xs text-gray-500">Minutes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{timeLeft.seconds}</div>
          <div className="text-xs text-gray-500">Seconds</div>
        </div>
      </div>

      {isClosingSoon && <div className="text-center text-red-600 font-medium animate-pulse">Closing soon!</div>}
    </div>
  )
}
