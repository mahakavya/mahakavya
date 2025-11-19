import type React from "react"
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-amber-900 mb-2">{title}</h1>
        {subtitle && <p className="text-amber-700 text-lg">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
