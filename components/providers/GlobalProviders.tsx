"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary, setupGlobalErrorHandling } from "@/lib/error-handler"
import { monitoring } from "@/lib/monitoring"
import { ENV, validateEnvironment } from "@/config/env"

interface GlobalProvidersProps {
  children: React.ReactNode
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    async function initializeServices() {
      try {
        // Validate environment
        const envValidation = validateEnvironment()
        if (!envValidation.valid) {
          console.warn("Missing environment variables:", envValidation.missing)
        }

        // Setup global error handling
        setupGlobalErrorHandling()

        // Initialize monitoring service
        if (monitoring && typeof monitoring.initialize === "function") {
          await monitoring.initialize()

          // Make monitoring available globally for error reporting
          if (typeof window !== "undefined") {
            ;(window as any).monitoring = monitoring
          }
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize services:", error)
        setInitError(error instanceof Error ? error.message : "Unknown initialization error")
        setIsInitialized(true) // Still allow the app to render
      }
    }

    initializeServices()

    // Cleanup function
    return () => {
      try {
        if (monitoring && typeof monitoring.destroy === "function") {
          monitoring.destroy().catch((error: Error) => {
            console.error("Error during monitoring cleanup:", error)
          })
        }
      } catch (error) {
        console.error("Error during cleanup:", error)
      }
    }
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Initializing application...</p>
        </div>
      </div>
    )
  }

  // Show error state if initialization failed critically
  if (initError && ENV.NODE_ENV === "development") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Initialization Error</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default GlobalProviders
