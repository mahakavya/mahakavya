interface KpiStatProps {
  label: string
  value: string
  delta?: {
    value: number
    trend: "up" | "down"
  }
}

export function KpiStat({ label, value, delta }: KpiStatProps) {
  return (
    <div className="heritage-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-amber-700">{label}</p>
          <p className="text-2xl font-bold text-amber-900">{value}</p>
        </div>
        {delta && (
          <div className={`flex items-center text-sm ${delta.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
            <span className="font-medium">
              {delta.trend === "up" ? "+" : "-"}
              {delta.value}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
