import { Badge } from "@/components/ui/badge"

interface StatusPillProps {
  status: "active" | "past_due" | "trialing" | "canceled"
}

export function StatusPill({ status }: StatusPillProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-600 hover:bg-green-700",
          ariaLabel: "Subscription is active",
        }
      case "past_due":
        return {
          label: "Past Due",
          className: "bg-red-600 hover:bg-red-700",
          ariaLabel: "Payment is past due",
        }
      case "trialing":
        return {
          label: "Trial",
          className: "bg-blue-600 hover:bg-blue-700",
          ariaLabel: "In trial period",
        }
      case "canceled":
        return {
          label: "Canceled",
          className: "bg-gray-600 hover:bg-gray-700",
          ariaLabel: "Subscription is canceled",
        }
      default:
        return {
          label: "Unknown",
          className: "bg-gray-600 hover:bg-gray-700",
          ariaLabel: "Unknown status",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge className={`text-white ${config.className}`} aria-label={config.ariaLabel}>
      {config.label}
    </Badge>
  )
}
