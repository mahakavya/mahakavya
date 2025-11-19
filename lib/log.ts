interface LogContext {
  userId?: string
  action?: string
  metadata?: Record<string, any>
  // allow additional ad-hoc fields for logging payloads
  [key: string]: any
}

class Logger {
  private isDev = process.env.NODE_ENV === "development"

  info(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context)
    }
    // In production, send to Sentry or logging service
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(`[ERROR] ${message}`, { error, ...context })
    // In production, send to Sentry
    if (typeof window !== "undefined" && (window as any).Sentry) {
      ;(window as any).Sentry.captureException(error || new Error(message), {
        extra: context,
      })
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context)
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, context)
    }
  }
}

export const logger = new Logger()
