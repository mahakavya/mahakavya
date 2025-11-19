import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  status: "live" | "coming-soon" | "beta"
  href?: string
}

export function FeatureCard({ title, description, icon: Icon, status, href }: FeatureCardProps) {
  const statusColors = {
    live: "bg-green-100 text-green-800",
    "coming-soon": "bg-yellow-100 text-yellow-800",
    beta: "bg-blue-100 text-blue-800",
  }

  const CardWrapper = href ? "a" : "div"
  const cardProps = href ? { href } : {}

  return (
    <CardWrapper {...cardProps} className={href ? "block" : ""}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Icon className="h-8 w-8 text-blue-600" />
            <Badge className={statusColors[status]}>{status.replace("-", " ")}</Badge>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-600">{description}</CardDescription>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
