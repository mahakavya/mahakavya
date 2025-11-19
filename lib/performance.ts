interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
}

interface WebVitalsMetric {
  name: string
  value: number
  id: string
  delta: number
}

class PerformanceService {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private isInitialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.initialize()
    }
  }

  private initialize() {
    if (this.isInitialized) return

    // Set up performance observers
    this.setupNavigationObserver()
    this.setupResourceObserver()
    this.setupLongTaskObserver()
    this.setupLayoutShiftObserver()

    // Set up Web Vitals
    this.setupWebVitals()

    this.isInitialized = true
    console.log("Performance monitoring initialized")
  }

  private setupNavigationObserver() {
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              const navEntry = entry as PerformanceNavigationTiming
              this.recordMetric("page_load_time", navEntry.loadEventEnd - navEntry.fetchStart, "ms")
              this.recordMetric("dom_content_loaded", navEntry.domContentLoadedEventEnd - navEntry.fetchStart, "ms")
              this.recordMetric("first_paint", navEntry.responseEnd - navEntry.fetchStart, "ms")
            }
          }
        })
        observer.observe({ entryTypes: ["navigation"] })
        this.observers.push(observer)
      } catch (error) {
        console.warn("Navigation observer not supported:", error)
      }
    }
  }

  private setupResourceObserver() {
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "resource") {
              const resourceEntry = entry as PerformanceResourceTiming
              this.recordMetric(`resource_${resourceEntry.initiatorType}`, resourceEntry.duration, "ms")
            }
          }
        })
        observer.observe({ entryTypes: ["resource"] })
        this.observers.push(observer)
      } catch (error) {
        console.warn("Resource observer not supported:", error)
      }
    }
  }

  private setupLongTaskObserver() {
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "longtask") {
              this.recordMetric("long_task", entry.duration, "ms")
            }
          }
        })
        observer.observe({ entryTypes: ["longtask"] })
        this.observers.push(observer)
      } catch (error) {
        console.warn("Long task observer not supported:", error)
      }
    }
  }

  private setupLayoutShiftObserver() {
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "layout-shift" && !(entry as any).hadRecentInput) {
              this.recordMetric("layout_shift", (entry as any).value, "score")
            }
          }
        })
        observer.observe({ entryTypes: ["layout-shift"] })
        this.observers.push(observer)
      } catch (error) {
        console.warn("Layout shift observer not supported:", error)
      }
    }
  }

  private setupWebVitals() {
    // Import and setup web-vitals if available
    if (typeof window !== "undefined") {
      import("web-vitals")
        .then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          getCLS(this.onWebVital.bind(this))
          getFID(this.onWebVital.bind(this))
          getFCP(this.onWebVital.bind(this))
          getLCP(this.onWebVital.bind(this))
          getTTFB(this.onWebVital.bind(this))
        })
        .catch(() => {
          console.warn("Web Vitals not available")
        })
    }
  }

  private onWebVital(metric: WebVitalsMetric) {
    this.recordMetric(`web_vital_${metric.name.toLowerCase()}`, metric.value, "ms")

    // Send to monitoring service
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", metric.name, {
        event_category: "Web Vitals",
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }
  }

  recordMetric(name: string, value: number, unit = "count") {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    console.log(`Performance Metric - ${name}:`, value, unit)
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name)
  }

  clearMetrics() {
    this.metrics = []
  }

  destroy() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
    this.metrics = []
    this.isInitialized = false
    console.log("Performance monitoring destroyed")
  }
}

// Create singleton instance
export const performanceService = new PerformanceService()

// Setup function for global performance monitoring
export function setupPerformanceMonitoring() {
  if (typeof window !== "undefined") {
    // Record initial page load metrics
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        if (navigation) {
          performanceService.recordMetric("total_page_load", navigation.loadEventEnd - navigation.fetchStart, "ms")
          performanceService.recordMetric("dom_interactive", navigation.domInteractive - navigation.fetchStart, "ms")
          performanceService.recordMetric("dom_complete", navigation.domComplete - navigation.fetchStart, "ms")
        }
      }, 0)
    })

    // Record page visibility changes
    document.addEventListener("visibilitychange", () => {
      performanceService.recordMetric("visibility_change", document.hidden ? 0 : 1, "boolean")
    })

    console.log("Global performance monitoring setup complete")
  }
}

// Export types
export type { PerformanceMetric, WebVitalsMetric }
