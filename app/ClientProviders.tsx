"use client"

import type React from "react"
import { AuthProvider } from "@/hooks/use-auth"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { setupGlobalErrorHandling } from "@/lib/error-handler"
import { useEffect, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AlertsProvider, NetworkMonitor, GlobalBillingAlerts } from "@/lib/alerts"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupGlobalErrorHandling()
  }, [])

  // Keep a stable QueryClient instance for the lifetime of this provider
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors
              if (error instanceof Error && error.message.includes("4")) {
                return false
              }
              return failureCount < 3
            },
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <AlertsProvider>
            {children}
            <NetworkMonitor />
            <GlobalBillingAlerts />
            <Toaster />
          </AlertsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
