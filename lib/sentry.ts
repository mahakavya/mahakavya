import * as Sentry from "@sentry/nextjs"
import { ENV } from "@/config/env"

export function initSentry() {
  if (!ENV.SENTRY_DSN) {
    console.warn("Sentry DSN not configured. Error monitoring is disabled.")
    return
  }

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    environment: ENV.NODE_ENV,
    enabled: ENV.NODE_ENV === "production",
    tracesSampleRate: 1.0,
    debug: false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out common non-critical errors
      if (event.exception?.values?.[0]?.value?.includes("Network request failed")) {
        return null
      }
      return event
    },
  })
}

export function captureError(error: Error | unknown, context?: Record<string, any>) {
  console.error("Error captured:", error, context)

  if (!ENV.SENTRY_DSN) return

  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: context,
    })
  } else {
    Sentry.captureMessage(String(error), {
      level: "error",
      extra: context,
    })
  }
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  console.log(`[${level}]`, message)

  if (!ENV.SENTRY_DSN) return

  Sentry.captureMessage(message, { level })
}

export function setUserContext(user: { id: string; email?: string; name?: string }) {
  if (!ENV.SENTRY_DSN) return

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  })
}

export function clearUserContext() {
  if (!ENV.SENTRY_DSN) return

  Sentry.setUser(null)
}
