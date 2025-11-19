import { AlertTriangle, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HiddenContentCardProps {
  entityType: "post" | "reel" | "comment"
  reason?: string
  isOwner?: boolean
}

export function HiddenContentCard({ entityType, reason, isOwner }: HiddenContentCardProps) {
  if (!isOwner) {
    return null // Don't show hidden content to non-owners
  }

  return (
    <Card className="bg-red-50/60 backdrop-blur-md border border-red-200/40 rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-2">Content Hidden by Safety System</h3>
            <p className="text-red-700 text-sm mb-4">
              Your {entityType} was automatically hidden because it may violate our community guidelines
              {reason && ` (${reason.replace("-", " ")})`}.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/guidelines" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Community Guidelines
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/support" className="flex items-center gap-2">
                  Appeal Decision
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
