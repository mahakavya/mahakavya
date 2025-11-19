"use client"

import React from "react"

import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon | string
  title: string
  description?: string
  action?:
    | {
        label: string
        onClick: () => void
      }
    | React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-4">
          {typeof Icon === "string" ? (
            <div className="text-6xl">{Icon}</div>
          ) : (
            <Icon className="h-16 w-16 text-amber-400" />
          )}
        </div>
      )}
      <h3 className="text-xl font-semibold text-amber-900 mb-2">{title}</h3>
      {description && <p className="text-amber-700 mb-6 max-w-md">{description}</p>}
      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button onClick={action.onClick} className="heritage-button">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
