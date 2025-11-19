"use client"
import { Heart, Star, Sparkles, Circle } from "lucide-react"

export function FloatingElements() {
  const elements = [
    { Icon: Heart, delay: 0, duration: 8, size: "w-4 h-4", color: "text-red-400/30" },
    { Icon: Star, delay: 2, duration: 10, size: "w-5 h-5", color: "text-orange-400/30" },
    { Icon: Sparkles, delay: 4, duration: 12, size: "w-3 h-3", color: "text-pink-400/30" },
    { Icon: Circle, delay: 1, duration: 9, size: "w-2 h-2", color: "text-red-300/40" },
    { Icon: Heart, delay: 6, duration: 11, size: "w-3 h-3", color: "text-orange-300/30" },
    { Icon: Star, delay: 3, duration: 7, size: "w-4 h-4", color: "text-pink-300/30" },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element, index) => (
        <div
          key={index}
          className={`absolute animate-float ${element.color} ${element.size}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
          }}
        >
          <element.Icon className="w-full h-full" />
        </div>
      ))}

      {/* Floating Swastik symbols */}
      <div className="absolute top-20 left-10 text-orange-300 text-2xl animate-float">卍</div>
      <div className="absolute top-40 right-20 text-red-300 text-lg animate-float animation-delay-1000">ॐ</div>
      <div className="absolute bottom-40 left-20 text-pink-300 text-xl animate-float animation-delay-2000">卍</div>
      <div className="absolute bottom-20 right-10 text-orange-300 text-lg animate-float animation-delay-3000">ॐ</div>
      <div className="absolute top-60 left-1/2 text-red-300 text-sm animate-float animation-delay-4000">卍</div>
    </div>
  )
}
