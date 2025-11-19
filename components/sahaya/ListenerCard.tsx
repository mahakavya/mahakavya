"use client"

import { Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ListenerCardProps {
  id: string
  name: string
  avatar?: string
  bio: string
  expertise: string[]
  rating: number
  isActive: boolean
  onView?: (id: string) => void
}

export function ListenerCard({ id, name, avatar, bio, expertise, rating, isActive, onView }: ListenerCardProps) {
  const handleView = () => {
    onView?.(id)
  }

  return (
    <Card
      className={cn(
        "bg-white/60 backdrop-blur-md border-white/40 rounded-2xl shadow-sm transition-all hover:shadow-md",
        !isActive && "opacity-60",
      )}
      data-testid="listener-card"
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <Avatar className="w-12 h-12 border-2 border-white/40">
            <AvatarImage src={avatar || "/placeholder.svg"} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
              <User className="w-6 h-6 text-gray-600" />
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <div className="flex items-center space-x-1 text-sm text-amber-600">
                <Star className="w-4 h-4 fill-current" />
                <span>{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Expertise */}
            <div className="flex flex-wrap gap-1 mb-3">
              {expertise.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {skill}
                </Badge>
              ))}
              {expertise.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-50 text-gray-600">
                  +{expertise.length - 3} more
                </Badge>
              )}
            </div>

            {/* Bio */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{bio}</p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500" : "bg-gray-400")} />
                <span className="text-xs text-gray-500">{isActive ? "Available" : "Offline"}</span>
              </div>

              <Button
                onClick={handleView}
                size="sm"
                disabled={!isActive}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
