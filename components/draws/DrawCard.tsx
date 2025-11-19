"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, IndianRupee } from "lucide-react"
import { formatINR } from "@/lib/money"
import Link from "next/link"

interface DrawCardProps {
  id: string
  title: string
  draw_at: string
  status: "upcoming" | "closed" | "completed"
  ticket_price: number
  entries_count: number
}

export function DrawCard({ id, title, draw_at, status, ticket_price, entries_count }: DrawCardProps) {
  const drawTime = new Date(draw_at)
  const now = new Date()
  const isUpcoming = status === "upcoming" && drawTime > now

  const getStatusColor = () => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "upcoming":
        return "Open"
      case "closed":
        return "Resolving"
      case "completed":
        return "Completed"
      default:
        return status
    }
  }

  return (
    <Card
      className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
      data-testid="draw-card"
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">{title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {drawTime.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{entries_count} entries</span>
              </div>
            </div>
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-medium">
            {ticket_price === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              <>
                <IndianRupee className="h-4 w-4" />
                <span>{formatINR(ticket_price)}</span>
              </>
            )}
          </div>
          <Button asChild size="sm">
            <Link href={`/bhagyachakra/${id}`}>{status === "completed" ? "View Result" : "View Details"}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
