import { ENV } from "@/config/env"

interface MonitoringConfig {
  apiKey?: string
  environment?: string
  debug?: boolean
}

type CleanupFunction = () => void | Promise<void>

// Event types for monitoring
export interface MonitoringEvent {
  type: "error" | "performance" | "user_action" | "system" | "security"
  message: string
  data?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
}

// Performance metrics
export interface PerformanceMetric {
  name: string
  value: number
  unit: "ms" | "bytes" | "count" | "percentage"
  timestamp: Date
  tags?: Record<string, string>
}

// Error tracking
export interface ErrorEvent {
  message: string
  stack?: string
  code?: string
  severity: "low" | "medium" | "high" | "critical"
  context?: Record<string, any>
  timestamp: Date
  userId?: string
}

// Health check and alert functionality
export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  checks: {
    database: CheckResult
    api: CheckResult
    cache: CheckResult
    storage: CheckResult
  }
  metrics: {
    uptime: number
    responseTime: number
    errorRate: number
  }
}

export interface CheckResult {
  status: "ok" | "warning" | "error"
  message: string
  latency?: number
}

export interface Alert {
  severity: "critical" | "high" | "medium" | "low"
  title: string
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

class MonitoringService {
  private config: MonitoringConfig
  private events: MonitoringEvent[] = []
  private metrics: PerformanceMetric[] = []
  private errors: ErrorEvent[] = []
  private isEnabled: boolean
  private cleanupFunctions: CleanupFunction[] = []
  private isInitialized = false
  private isDestroyed = false

  constructor(config: MonitoringConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NEXT_PUBLIC_ANALYTICS_ID,
      environment: config.environment || process.env.NODE_ENV || "development",
      debug: config.debug || process.env.NODE_ENV === "development",
    }
    this.isEnabled = ENV?.ENABLE_MONITORING !== false // Default to true
  }

  async initialize() {
    if (this.isInitialized || this.isDestroyed) return

    try {
      if (this.config.debug) {
        console.log("Initializing monitoring service...")
      }

      // Initialize monitoring services here
      this.isInitialized = true

      if (this.config.debug) {
        console.log("Monitoring service initialized successfully")
      }
    } catch (error) {
      console.error("Failed to initialize monitoring service:", error)
    }
  }

  // Log monitoring events
  logEvent(event: Omit<MonitoringEvent, "timestamp">): void {
    if (!this.isEnabled) return

    try {
      const fullEvent: MonitoringEvent = {
        ...event,
        timestamp: new Date(),
      }

      this.events.push(fullEvent)

      // Keep only last 1000 events in memory
      if (this.events.length > 1000) {
        this.events = this.events.slice(-1000)
      }

      // Log to console in development
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.log("[Monitoring]", fullEvent)
      }

      // Send to external monitoring service in production
      if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
        this.sendToExternalService(fullEvent)
      }
    } catch (error) {
      console.warn("Failed to log monitoring event:", error)
    }
  }

  // Track performance metrics
  trackMetric(metric: Omit<PerformanceMetric, "timestamp">): void {
    if (!this.isEnabled) return

    try {
      const fullMetric: PerformanceMetric = {
        ...metric,
        timestamp: new Date(),
      }

      this.metrics.push(fullMetric)

      // Keep only last 500 metrics in memory
      if (this.metrics.length > 500) {
        this.metrics = this.metrics.slice(-500)
      }

      // Log performance issues
      if (metric.name === "page_load_time" && metric.value > 3000) {
        this.logEvent({
          type: "performance",
          message: `Slow page load detected: ${metric.value}ms`,
          data: { metric: fullMetric },
        })
      }
    } catch (error) {
      console.warn("Failed to track metric:", error)
    }
  }

  // Track errors
  trackError(error: Omit<ErrorEvent, "timestamp">): void {
    if (!this.isEnabled) return

    try {
      const fullError: ErrorEvent = {
        ...error,
        timestamp: new Date(),
      }

      this.errors.push(fullError)

      // Keep only last 100 errors in memory
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100)
      }

      // Log error event
      this.logEvent({
        type: "error",
        message: error.message,
        data: { error: fullError },
      })

      // Log to console
      if (typeof window !== "undefined") {
        console.error("[Monitoring Error]", fullError)
      }
    } catch (err) {
      console.warn("Failed to track error:", err)
    }
  }

  // Track user actions (flexible signature for backward compatibility)
  trackUserAction(
    action: string,
    categoryOrData?: string | Record<string, any>,
    dataOrUserId?: Record<string, any> | string,
    maybeUserId?: string,
  ): void {
    let category: string | undefined
    let data: Record<string, any> | undefined
    let userId: string | undefined

    if (typeof categoryOrData === "string") {
      category = categoryOrData
      if (typeof dataOrUserId === "string") {
        userId = dataOrUserId
      } else if (typeof dataOrUserId === "object") {
        data = dataOrUserId
        if (typeof maybeUserId === "string") userId = maybeUserId
      }
    } else if (typeof categoryOrData === "object") {
      data = categoryOrData
      if (typeof dataOrUserId === "string") userId = dataOrUserId
    }

    this.logEvent({
      type: "user_action",
      message: `User action: ${action}`,
      data: { ...(data || {}), ...(category ? { category } : {}) },
      userId,
    })
  }

  // Alias for trackUserAction for compatibility with older call sites
  logUserAction(
    action: string,
    categoryOrData?: string | Record<string, any>,
    dataOrUserId?: Record<string, any> | string,
    maybeUserId?: string,
  ): void {
    this.trackUserAction(action, categoryOrData as any, dataOrUserId as any, maybeUserId)
  }

  // Backward-compatible error logging (older code called monitoring.logError)
  logError(err: Error | Omit<ErrorEvent, "timestamp">, data?: Record<string, any>, userId?: string) {
    if (!err) return
    if (err instanceof Error) {
      this.trackError({ message: err.message, stack: err.stack, severity: "medium", context: data || {}, userId })
    } else {
      const e = err as Omit<ErrorEvent, "timestamp"> & { message: string }
      this.trackError({
        message: e.message || "Error",
        stack: e.stack,
        severity: e.severity || "medium",
        context: data || e.context,
        userId: userId || e.userId,
      })
    }
  }

  // Backward-compatible system logging
  logSystem(message: string, data?: Record<string, any>) {
    this.trackSystemEvent(message, data)
  }

  // Convenience aliases used in some code paths
  info(message: string, data?: Record<string, any>) {
    this.logSystem(message, data)
  }

  error(messageOrError: string | Error, data?: Record<string, any>) {
    if (typeof messageOrError === "string") {
      this.trackError({ message: messageOrError, severity: "medium", context: data || {} })
    } else {
      this.logError(messageOrError, data)
    }
  }

  // Track system events
  trackSystemEvent(event: string, data?: Record<string, any>): void {
    this.logEvent({
      type: "system",
      message: `System event: ${event}`,
      data,
    })
  }

  // Track security events
  trackSecurityEvent(event: string, data?: Record<string, any>, userId?: string): void {
    this.logEvent({
      type: "security",
      message: `Security event: ${event}`,
      data,
      userId,
    })
  }

  // Get recent events
  getRecentEvents(limit = 50): MonitoringEvent[] {
    return this.events.slice(-limit)
  }

  // Get recent metrics
  getRecentMetrics(limit = 50): PerformanceMetric[] {
    return this.metrics.slice(-limit)
  }

  // Get recent errors
  getRecentErrors(limit = 20): ErrorEvent[] {
    return this.errors.slice(-limit)
  }

  // Get system health
  getSystemHealth(): {
    status: "healthy" | "warning" | "critical"
    metrics: {
      totalEvents: number
      totalErrors: number
      errorRate: number
      avgResponseTime: number
    }
  } {
    const recentEvents = this.getRecentEvents(100)
    const recentErrors = this.getRecentErrors(50)
    const recentMetrics = this.getRecentMetrics(50)

    const errorRate = recentEvents.length > 0 ? (recentErrors.length / recentEvents.length) * 100 : 0
    const responseTimeMetrics = recentMetrics.filter((m) => m.name === "api_response_time")
    const avgResponseTime =
      responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
        : 0

    let status: "healthy" | "warning" | "critical" = "healthy"
    if (errorRate > 10 || avgResponseTime > 2000) {
      status = "warning"
    }
    if (errorRate > 25 || avgResponseTime > 5000) {
      status = "critical"
    }

    return {
      status,
      metrics: {
        totalEvents: recentEvents.length,
        totalErrors: recentErrors.length,
        errorRate,
        avgResponseTime,
      },
    }
  }

  // Send to external monitoring service
  private async sendToExternalService(event: MonitoringEvent): Promise<void> {
    try {
      // In a real application, you would send to services like:
      // - Sentry for error tracking
      // - DataDog for metrics
      // - LogRocket for user sessions
      // - Custom analytics endpoint

      // Mock implementation — only send if an API key is configured
      if (this.config.apiKey) {
        await fetch("/api/monitoring/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": this.config.apiKey,
          },
          body: JSON.stringify(event),
        })
      }
    } catch (error) {
      console.error("Failed to send monitoring event to external service:", error)
    }
  }

  // Log API calls (path, method, durationMs, statusCode, optional userId)
  logApiCall(path: string, method: string, durationMs: number, statusCode: number, userId?: string) {
    try {
      this.trackMetric({ name: "api_call_duration", value: durationMs, unit: "ms" })
      this.logEvent({
        type: "system",
        message: `API ${method} ${path} responded ${statusCode}`,
        data: { path, method, durationMs, statusCode },
        userId,
      })
    } catch (err) {
      console.warn("Failed to log API call:", err)
    }
  }

  // Performance monitoring helpers
  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      this.trackMetric({
        name,
        value: duration,
        unit: "ms",
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.trackMetric({
        name: `${name}_error`,
        value: duration,
        unit: "ms",
      })
      throw error
    }
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.trackMetric({
        name,
        value: duration,
        unit: "ms",
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.trackMetric({
        name: `${name}_error`,
        value: duration,
        unit: "ms",
      })
      throw error
    }
  }

  addCleanup(cleanup: CleanupFunction) {
    this.cleanupFunctions.push(cleanup)
  }

  async destroy() {
    if (this.isDestroyed) return

    try {
      if (this.config.debug) {
        console.log("Destroying monitoring service...")
      }

      // Clear all stored data
      this.events = []
      this.metrics = []
      this.errors = []

      // Run all cleanup functions
      await Promise.all(
        this.cleanupFunctions.map(async (cleanup) => {
          try {
            await cleanup()
          } catch (error) {
            console.error("Error during cleanup:", error)
          }
        }),
      )

      this.cleanupFunctions = []
      this.isDestroyed = true
      this.isInitialized = false

      if (this.config.debug) {
        console.log("Monitoring service destroyed successfully")
      }
    } catch (error) {
      console.error("Error destroying monitoring service:", error)
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isInitialized || this.isDestroyed) return

    try {
      if (this.config.debug) {
        console.log("Tracking event:", event, properties)
      }
      // Implement actual tracking logic here
    } catch (error) {
      console.error("Error tracking event:", error)
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isInitialized || this.isDestroyed) return

    try {
      if (this.config.debug) {
        console.log("Identifying user:", userId, traits)
      }
      // Implement actual identification logic here
    } catch (error) {
      console.error("Error identifying user:", error)
    }
  }

  page(name?: string, properties?: Record<string, any>) {
    if (!this.isInitialized || this.isDestroyed) return

    try {
      if (this.config.debug) {
        console.log("Page view:", name, properties)
      }
      // Implement actual page tracking logic here
    } catch (error) {
      console.error("Error tracking page view:", error)
    }
  }

  // Health check and alert functionality
  async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now()

    const [database, api, cache, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkAPI(),
      this.checkCache(),
      this.checkStorage(),
    ])

    const responseTime = Date.now() - startTime

    return {
      status: this.determineOverallStatus([database, api, cache, storage]),
      timestamp: new Date().toISOString(),
      checks: {
        database,
        api,
        cache,
        storage,
      },
      metrics: {
        uptime: process.uptime(),
        responseTime,
        errorRate: await this.getErrorRate(),
      },
    }
  }

  private async checkDatabase(): Promise<CheckResult> {
    try {
      // Only run server-side checks on the server
      if (typeof window !== "undefined") {
        return {
          status: "ok",
          message: "Client-side check skipped",
        }
      }

      const { createSupabaseServerClient } = await import("./supabase-server")
      const supabase = createSupabaseServerClient()

      const start = Date.now()
      const { error } = await supabase.from("profiles").select("id").limit(1)
      const latency = Date.now() - start

      if (error) {
        return {
          status: "error",
          message: `Database error: ${error.message}`,
          latency,
        }
      }

      if (latency > 1000) {
        return {
          status: "warning",
          message: "Database responding slowly",
          latency,
        }
      }

      return {
        status: "ok",
        message: "Database operational",
        latency,
      }
    } catch (error) {
      return {
        status: "error",
        message: "Failed to connect to database",
      }
    }
  }

  private async checkAPI(): Promise<CheckResult> {
    try {
      const start = Date.now()
      const response = await fetch("/api/health", { method: "HEAD" })
      const latency = Date.now() - start

      if (!response.ok) {
        return {
          status: "error",
          message: `API returned ${response.status}`,
          latency,
        }
      }

      return {
        status: "ok",
        message: "API operational",
        latency,
      }
    } catch (error) {
      return {
        status: "error",
        message: "API unreachable",
      }
    }
  }

  private async checkCache(): Promise<CheckResult> {
    // Implement cache health check when Redis is added
    return {
      status: "ok",
      message: "Cache operational (in-memory)",
    }
  }

  private async checkStorage(): Promise<CheckResult> {
    try {
      // Only run server-side checks on the server
      if (typeof window !== "undefined") {
        return {
          status: "ok",
          message: "Client-side check skipped",
        }
      }

      const { createSupabaseServerClient } = await import("./supabase-server")
      const supabase = createSupabaseServerClient()

      const { data, error } = await supabase.storage.listBuckets()

      if (error) {
        return {
          status: "error",
          message: "Storage error",
        }
      }

      return {
        status: "ok",
        message: "Storage operational",
      }
    } catch (error) {
      return {
        status: "warning",
        message: "Storage check failed",
      }
    }
  }

  private determineOverallStatus(checks: CheckResult[]): "healthy" | "degraded" | "unhealthy" {
    const hasError = checks.some((c) => c.status === "error")
    const hasWarning = checks.some((c) => c.status === "warning")

    if (hasError) return "unhealthy"
    if (hasWarning) return "degraded"
    return "healthy"
  }

  private async getErrorRate(): Promise<number> {
    const recentErrors = this.getRecentErrors(50)
    const recentEvents = this.getRecentEvents(100)

    if (recentEvents.length === 0) return 0
    return (recentErrors.length / recentEvents.length) * 100
  }

  // Sends alerts for critical issues
  async sendAlert(alert: Alert): Promise<void> {
    // Log to monitoring service
    this.trackError({
      message: alert.message,
      severity: alert.severity === "critical" ? "critical" : (alert.severity as any),
      context: alert.metadata,
    })

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error(`[ALERT ${alert.severity}]`, alert.title, alert.message)
    }

    // In production, could also send to Slack, Email, PagerDuty, Discord, etc.
  }

  // Monitors API endpoint performance
  async monitorEndpoint(endpoint: string, operation: () => Promise<any>): Promise<any> {
    const startTime = Date.now()

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      // Log slow requests
      if (duration > 3000) {
        await this.sendAlert({
          severity: "medium",
          title: "Slow API Response",
          message: `${endpoint} took ${duration}ms`,
          timestamp: new Date().toISOString(),
          metadata: { endpoint, duration },
        })
      }

      this.logApiCall(endpoint, "UNKNOWN", duration, 200)
      return result
    } catch (error) {
      const duration = Date.now() - startTime

      await this.sendAlert({
        severity: "high",
        title: "API Error",
        message: `${endpoint} failed: ${error}`,
        timestamp: new Date().toISOString(),
        metadata: { endpoint, error },
      })

      this.logApiCall(endpoint, "UNKNOWN", duration, 500)
      throw error
    }
  }
}

// Create singleton instance
const monitoringService = new MonitoringService()

// Export the service instance and individual methods
export const monitoring = monitoringService
export const monitor = monitoringService // Alias for compatibility

// Export individual methods for convenience
export const logEvent = monitoringService.logEvent.bind(monitoringService)
export const trackMetric = monitoringService.trackMetric.bind(monitoringService)
export const trackError = monitoringService.trackError.bind(monitoringService)
export const trackUserAction = monitoringService.trackUserAction.bind(monitoringService)
export const logUserAction = monitoringService.logUserAction.bind(monitoringService)
export const trackSystemEvent = monitoringService.trackSystemEvent.bind(monitoringService)
export const trackSecurityEvent = monitoringService.trackSecurityEvent.bind(monitoringService)
export const measurePerformance = monitoringService.measurePerformance.bind(monitoringService)
export const measureAsyncPerformance = monitoringService.measureAsyncPerformance.bind(monitoringService)
export const logApiCall = monitoringService.logApiCall.bind(monitoringService)
export const logError = monitoringService.logError.bind(monitoringService)
export const logSystem = monitoringService.logSystem.bind(monitoringService)
export const info = monitoringService.info.bind(monitoringService)
export const error = monitoringService.error.bind(monitoringService)
export const performHealthCheck = monitoringService.performHealthCheck.bind(monitoringService)
export const sendAlert = monitoringService.sendAlert.bind(monitoringService)
export const monitorEndpoint = monitoringService.monitorEndpoint.bind(monitoringService)

// Export config type
export type { MonitoringConfig }

// Default export
export default monitoringService
