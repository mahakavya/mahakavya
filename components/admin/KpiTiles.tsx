"use client"

import { KpiStat } from "@/components/kpi-stat"
import { formatINR } from "@/lib/money"

interface AdminStats {
  usersTotal: number
  usersActive: number
  postsTotal: number
  reelsTotal: number
  mrr: number
  donationsThisMonth: number
  introUnlocks: number
}

interface KpiTilesProps {
  data: AdminStats
}

export function KpiTiles({ data }: KpiTilesProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-kpis">
      <KpiStat label="Total Users" value={data.usersTotal.toLocaleString()} trend={`${data.usersActive} active`} />
      <KpiStat
        label="Content"
        value={`${data.postsTotal + data.reelsTotal}`}
        trend={`${data.postsTotal} posts, ${data.reelsTotal} reels`}
      />
      <KpiStat label="Monthly Revenue" value={formatINR(data.mrr)} trend="Recurring subscriptions" />
      <KpiStat label="This Month" value={formatINR(data.donationsThisMonth)} trend="Donations received" />
    </div>
  )
}
