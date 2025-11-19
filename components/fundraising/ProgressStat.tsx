"use client"

import { formatINR } from "@/lib/money"

interface ProgressStatProps {
  raised: number
  goal: number
  className?: string
}

export function ProgressStat({ raised, goal, className = "" }: ProgressStatProps) {
  const progress = Math.min((raised / goal) * 100, 100)

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-baseline">
        <div>
          <div className="text-2xl font-bold text-gray-900">{formatINR(raised)}</div>
          <div className="text-sm text-gray-600">raised of {formatINR(goal)} goal</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-orange-600">{progress.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">funded</div>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-xs text-gray-500">
        {raised === 0 ? "Be the first to support this campaign" : `${Math.round(progress)}% of goal reached`}
      </div>
    </div>
  )
}
