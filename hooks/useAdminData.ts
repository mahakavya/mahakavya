import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface AdminMetrics {
  dau_today: number
  new_signups_today: number
  premium_active: number
  total_revenue_est: number
  open_flags: number
  active_fundraisers: number
}

interface UsageTrend {
  usage_date: string
  dau: number
  posts: number
  reels: number
  messages: number
}

interface ModerationFlag {
  id: number
  content_type: string
  content_id: string
  reason: string
  status: string
  created_at: string
  reporter?: {
    full_name: string
    email: string
  }
}

interface AuditLog {
  id: number
  action: string
  target?: string
  meta?: any
  created_at: string
  actor?: {
    full_name: string
    email: string
  }
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin", "metrics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/metrics")
      if (!response.ok) {
        throw new Error("Failed to fetch metrics")
      }
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useUsageTrend(days = 30) {
  return useQuery<UsageTrend[]>({
    queryKey: ["admin", "usage-trend", days],
    queryFn: async () => {
      const response = await fetch(`/api/admin/usage-trend?days=${days}`)
      if (!response.ok) {
        throw new Error("Failed to fetch usage trend")
      }
      return response.json()
    },
  })
}

export function useModerationQueue(limit = 20) {
  return useQuery<ModerationFlag[]>({
    queryKey: ["admin", "moderation-queue", limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/moderation-queue?limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch moderation queue")
      }
      return response.json()
    },
  })
}

export function useAuditLogs(limit = 20) {
  return useQuery<AuditLog[]>({
    queryKey: ["admin", "audit", limit],
    queryFn: async () => {
      const response = await fetch(`/api/admin/audit?limit=${limit}`)
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs")
      }
      return response.json()
    },
  })
}

export function useResolveModerationFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "APPROVED" | "REJECTED" }) => {
      const response = await fetch(`/api/admin/moderation/${id}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to resolve flag")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["admin", "moderation-queue"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "audit"] })
    },
  })
}
