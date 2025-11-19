"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { X, CreditCard, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AlertsContextType {
  showAlert: (alert: AlertConfig) => void
  hideAlert: (id: string) => void
  alerts: AlertConfig[]
}

interface AlertConfig {
  id: string
  type: "info" | "warning" | "error" | "success"
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
  autoHide?: number // milliseconds
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined)

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertConfig[]>([])

  const showAlert = (alert: AlertConfig) => {
    setAlerts((prev) => {
      // Remove existing alert with same id
      const filtered = prev.filter((a) => a.id !== alert.id)
      return [...filtered, alert]
    })

    // Auto-hide if specified
    if (alert.autoHide && !alert.persistent) {
      setTimeout(() => {
        hideAlert(alert.id)
      }, alert.autoHide)
    }
  }

  const hideAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }

  return (
    <AlertsContext.Provider value={{ showAlert, hideAlert, alerts }}>
      {children}
      <AlertsContainer />
    </AlertsContext.Provider>
  )
}

export function useAlerts() {
  const context = useContext(AlertsContext)
  if (!context) {
    throw new Error("useAlerts must be used within AlertsProvider")
  }
  return context
}

function AlertsContainer() {
  const { alerts, hideAlert } = useAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <Alert key={alert.id} className={getAlertClassName(alert.type)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {getAlertIcon(alert.type)}
                <h4 className="font-medium">{alert.title}</h4>
              </div>
              {alert.description && <AlertDescription className="mt-1">{alert.description}</AlertDescription>}
              {alert.action && (
                <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={alert.action.onClick}>
                  {alert.action.label}
                </Button>
              )}
            </div>
            {!alert.persistent && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => hideAlert(alert.id)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  )
}

function getAlertClassName(type: AlertConfig["type"]): string {
  const baseClasses = "border shadow-lg"

  switch (type) {
    case "error":
      return `${baseClasses} border-red-200 bg-red-50 text-red-900`
    case "warning":
      return `${baseClasses} border-yellow-200 bg-yellow-50 text-yellow-900`
    case "success":
      return `${baseClasses} border-green-200 bg-green-50 text-green-900`
    case "info":
    default:
      return `${baseClasses} border-blue-200 bg-blue-50 text-blue-900`
  }
}

function getAlertIcon(type: AlertConfig["type"]) {
  const iconClasses = "h-4 w-4"

  switch (type) {
    case "error":
      return <AlertTriangle className={`${iconClasses} text-red-600`} />
    case "warning":
      return <AlertTriangle className={`${iconClasses} text-yellow-600`} />
    case "success":
      return <CreditCard className={`${iconClasses} text-green-600`} />
    case "info":
    default:
      return <CreditCard className={`${iconClasses} text-blue-600`} />
  }
}

// Network Monitor Component
export function NetworkMonitor() {
  const { showAlert, hideAlert } = useAlerts()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      hideAlert("network-offline")
      showAlert({
        id: "network-online",
        type: "success",
        title: "Connection restored",
        description: "You're back online!",
        autoHide: 3000,
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      showAlert({
        id: "network-offline",
        type: "warning",
        title: "No internet connection",
        description: "Some features may not work properly.",
        persistent: true,
      })
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [showAlert, hideAlert])

  return null
}

// Global Billing Alerts Component
export function GlobalBillingAlerts() {
  const { showAlert } = useAlerts()
  const { toast } = useToast()

  useEffect(() => {
    const hasSupabaseConfig =
      typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!hasSupabaseConfig) {
      // Supabase not configured, skip billing check
      return
    }

    // Delay the billing check to avoid blocking initial render
    const timer = setTimeout(() => {
      checkBillingStatus()
    }, 2000)

    return () => clearTimeout(timer)
  }, [showAlert])

  const checkBillingStatus = async () => {
    try {
      const response = await fetch("/api/billing/subscription/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        // Don't show alerts for any errors (auth, network, etc)
        return
      }

      const data = await response.json()

      // Show alert if subscription is inactive or expired
      if (data.status === "inactive" && data.user_id) {
        showAlert({
          id: "billing-inactive",
          type: "info",
          title: "Upgrade to Premium",
          description: "Get unlimited access to all features",
          action: {
            label: "Upgrade Now",
            onClick: () => {
              window.location.href = "/billing"
            },
          },
          persistent: false,
          autoHide: 10000,
        })
      }
    } catch (error) {
      // No console.error to avoid cluttering logs with expected errors
    }
  }

  return null
}

// Utility functions for showing common alerts
export const showNetworkError = (showAlert: AlertsContextType["showAlert"]) => {
  showAlert({
    id: "network-error",
    type: "error",
    title: "Network Error",
    description: "Please check your internet connection and try again.",
    autoHide: 5000,
  })
}

export const showUpgradePrompt = (showAlert: AlertsContextType["showAlert"]) => {
  showAlert({
    id: "upgrade-prompt",
    type: "info",
    title: "Premium Feature",
    description: "This feature requires a premium subscription.",
    action: {
      label: "Upgrade",
      onClick: () => {
        window.location.href = "/billing"
      },
    },
    autoHide: 8000,
  })
}

export const showMaintenanceAlert = (showAlert: AlertsContextType["showAlert"]) => {
  showAlert({
    id: "maintenance",
    type: "warning",
    title: "Scheduled Maintenance",
    description: "Some features may be temporarily unavailable.",
    persistent: true,
  })
}

// Export types for external use
export type { AlertConfig, AlertsContextType }
