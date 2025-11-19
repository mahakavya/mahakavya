import { Loader2 } from "lucide-react"
import { SacredLogo } from "@/components/sacred-logo"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="text-center space-y-6">
        <div className="relative">
          <SacredLogo className="w-20 h-20 mx-auto animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            Mahakavya
          </h2>
          <p className="text-gray-600">महाकाव्य</p>
          <p className="text-sm text-gray-500">Loading your cultural journey...</p>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
