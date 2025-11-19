"use client"

import React from "react"
import { monitoring } from "@/lib/monitoring"

// Global error handler for unhandled errors
export function setupGlobalErrorHandling(): void {
  if (typeof window === "undefined") return

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason)

    if (monitoring && typeof monitoring.trackError === "function") {
      monitoring.trackError({
        message: `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
        stack: event.reason?.stack,
        severity: "high",
        context: {
          type: "unhandledrejection",
          reason: event.reason,
        },
      })
    }
  })

  // Handle global errors
  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error)

    if (monitoring && typeof monitoring.trackError === "function") {
      monitoring.trackError({
        message: event.error?.message || event.message || "Unknown error",
        stack: event.error?.stack,
        severity: "high",
        context: {
          type: "global_error",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }
  })
}

// React Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorInfo?: React.ErrorInfo; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo)

    // Track error with monitoring service
    if (monitoring && typeof monitoring.trackError === "function") {
      monitoring.trackError({
        message: error.message,
        stack: error.stack,
        severity: "critical",
        context: {
          type: "react_error_boundary",
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
      })
    }

    this.setState({
      error,
      errorInfo,
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} errorInfo={this.state.errorInfo} resetError={this.resetError} />
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Something went wrong</h3>
              <p className="mt-2 text-sm text-gray-500">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={this.resetError}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
                >
                  Reload Page
                </button>
              </div>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-600">Error Details</summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for error reporting
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    console.error("Manual error report:", error)

    if (monitoring && typeof monitoring.trackError === "function") {
      monitoring.trackError({
        message: error.message,
        stack: error.stack,
        severity: "medium",
        context: {
          type: "manual_report",
          ...errorInfo,
        },
      })
    }
  }, [])
}
