import { writeFileSync } from "fs"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"

interface FixAction {
  category: string
  issue: string
  action: string
  fix: () => Promise<void>
  priority: "HIGH" | "MEDIUM" | "LOW"
}

interface Issue {
  id: string
  title: string
  description: string
  severity: "high" | "medium" | "low"
  status: "pending" | "checking" | "fixed" | "failed"
  fix?: () => Promise<void>
}

class ProductionIssuesFixer {
  private fixes: FixAction[] = []

  constructor() {
    this.setupFixes()
  }

  private setupFixes() {
    // Environment variables fixes
    this.fixes.push({
      category: "Environment",
      issue: "Missing .env.example",
      action: "Create .env.example template",
      priority: "MEDIUM",
      fix: async () => {
        const envTemplate = `# Mahakavya Environment Variables

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Razorpay Configuration (Optional - for payments, server-only)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Push Notifications (Optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:support@mahakavya.app

# Application Settings
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production
`
        writeFileSync(".env.example", envTemplate)
      },
    })

    // Security fixes
    this.fixes.push({
      category: "Security",
      issue: "Missing robots.txt",
      action: "Create robots.txt for SEO",
      priority: "LOW",
      fix: async () => {
        const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://mahakavya.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin
Disallow: /api
Disallow: /auth
Disallow: /_next
`
        writeFileSync("public/robots.txt", robotsTxt)
      },
    })

    // PWA fixes
    this.fixes.push({
      category: "PWA",
      issue: "Missing service worker",
      action: "Create service worker for offline functionality",
      priority: "MEDIUM",
      fix: async () => {
        const serviceWorker = `const CACHE_NAME = 'mahakavya-v1'
const STATIC_ASSETS = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/offline',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
  
  // Notify all clients about the activation
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_ACTIVATED' })
    })
  })
})

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip API calls and external requests
  if (!event.request.url.startsWith(self.location.origin)) return
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline')
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.url ? { url: data.url } : undefined,
    actions: data.url ? [
      { action: 'open', title: 'Open', icon: '/icon-192x192.png' }
    ] : undefined
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || event.notification.data?.url) {
    const url = event.notification.data?.url || '/'
    event.waitUntil(
      clients.openWindow(url)
    )
  }
})
`
        writeFileSync("public/sw.js", serviceWorker)
      },
    })

    // Performance optimization
    this.fixes.push({
      category: "Performance",
      issue: "Missing sitemap",
      action: "Create sitemap for better SEO",
      priority: "MEDIUM",
      fix: async () => {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://mahakavya.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://mahakavya.com/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://mahakavya.com/signup</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://mahakavya.com/features</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://mahakavya.com/guidelines</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`
        writeFileSync("public/sitemap.xml", sitemap)
      },
    })

    // Service Worker Registration Component
    this.fixes.push({
      category: "PWA",
      issue: "Missing service worker registration",
      action: "Create service worker registration component",
      priority: "MEDIUM",
      fix: async () => {
        const swRegistration = `'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, prompt user to refresh
                  if (confirm('New version available! Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SW_ACTIVATED') {
          console.log('Service Worker activated')
        }
      })
    }
  }, [])

  return null
}
`
        writeFileSync("components/pwa/ServiceWorkerRegistration.tsx", swRegistration)
      },
    })
  }

  async executeAllFixes() {
    console.log("🔧 Starting automated fixes for production issues...\n")

    const highPriorityFixes = this.fixes.filter((f) => f.priority === "HIGH")
    const mediumPriorityFixes = this.fixes.filter((f) => f.priority === "MEDIUM")
    const lowPriorityFixes = this.fixes.filter((f) => f.priority === "LOW")

    // Execute high priority fixes first
    for (const fix of highPriorityFixes) {
      try {
        console.log(`🚨 [HIGH] ${fix.category}: ${fix.action}`)
        await fix.fix()
        console.log(`✅ Fixed: ${fix.issue}`)
      } catch (error) {
        console.log(`❌ Failed to fix: ${fix.issue} - ${error}`)
      }
    }

    // Execute medium priority fixes
    for (const fix of mediumPriorityFixes) {
      try {
        console.log(`⚠️  [MEDIUM] ${fix.category}: ${fix.action}`)
        await fix.fix()
        console.log(`✅ Fixed: ${fix.issue}`)
      } catch (error) {
        console.log(`❌ Failed to fix: ${fix.issue} - ${error}`)
      }
    }

    // Execute low priority fixes
    for (const fix of lowPriorityFixes) {
      try {
        console.log(`ℹ️  [LOW] ${fix.category}: ${fix.action}`)
        await fix.fix()
        console.log(`✅ Fixed: ${fix.issue}`)
      } catch (error) {
        console.log(`❌ Failed to fix: ${fix.issue} - ${error}`)
      }
    }

    console.log("\n✨ Automated fixes completed!")
    console.log("\n📋 Manual actions still required:")
    console.log("1. Set up environment variables in your deployment platform")
    console.log("2. Configure Supabase database and run migrations")
    console.log("3. Set up Razorpay payment gateway (if needed)")
    console.log("4. Configure domain and SSL certificates")
    console.log("5. Set up monitoring and alerting")
    console.log("6. Test all user flows in staging environment")
  }
}

export default function FixProductionIssues() {
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: "env-vars",
      title: "Environment Variables",
      description: "Check and validate all required environment variables",
      severity: "high",
      status: "pending",
      fix: async () => {
        // Check required environment variables
        const requiredVars = [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
          "SUPABASE_JWT_SECRET",
        ]

        const missing = requiredVars.filter((varName) => !process.env[varName])

        if (missing.length > 0) {
          throw new Error(`Missing environment variables: ${missing.join(", ")}`)
        }

        // Optional payment variables (server-side only)
        const paymentVars = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]

        const missingPayment = paymentVars.filter((varName) => !process.env[varName])
        if (missingPayment.length > 0) {
          console.warn(`Optional payment variables missing: ${missingPayment.join(", ")}`)
        }
      },
    },
    {
      id: "database",
      title: "Database Connection",
      description: "Verify Supabase database connection and schema",
      severity: "high",
      status: "pending",
      fix: async () => {
        const response = await fetch("/api/health")
        if (!response.ok) {
          throw new Error("Database health check failed")
        }
      },
    },
    {
      id: "auth",
      title: "Authentication Setup",
      description: "Verify Supabase Auth configuration",
      severity: "high",
      status: "pending",
      fix: async () => {
        // Test auth configuration
        const { createClient } = await import("@/lib/supabase")
        const supabase = createClient()

        const { data, error } = await supabase.auth.getSession()
        if (error && error.message !== "Auth session missing!") {
          throw new Error(`Auth configuration error: ${error.message}`)
        }
      },
    },
    {
      id: "storage",
      title: "File Storage",
      description: "Check Supabase Storage bucket configuration",
      severity: "medium",
      status: "pending",
      fix: async () => {
        const { createClient } = await import("@/lib/supabase")
        const supabase = createClient()

        const { data, error } = await supabase.storage.listBuckets()
        if (error) {
          throw new Error(`Storage error: ${error.message}`)
        }
      },
    },
    {
      id: "payments",
      title: "Payment Integration",
      description: "Verify Razorpay configuration (if enabled)",
      severity: "low",
      status: "pending",
      fix: async () => {
        try {
          const response = await fetch("/api/razorpay/config")
          if (!response.ok) {
            throw new Error("Razorpay configuration not available")
          }
          const config = await response.json()
          if (!config.keyId) {
            throw new Error("Razorpay key not configured")
          }
        } catch (error) {
          console.warn("Payment integration not configured:", error)
          // Don't fail for optional payment integration
        }
      },
    },
  ])

  const updateIssueStatus = (id: string, status: Issue["status"]) => {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status } : issue)))
  }

  const fixIssue = async (issue: Issue) => {
    if (!issue.fix) return

    updateIssueStatus(issue.id, "checking")

    try {
      await issue.fix()
      updateIssueStatus(issue.id, "fixed")
    } catch (error) {
      console.error(`Failed to fix ${issue.title}:`, error)
      updateIssueStatus(issue.id, "failed")
    }
  }

  const fixAllIssues = async () => {
    for (const issue of issues) {
      if (issue.status === "pending" && issue.fix) {
        await fixIssue(issue)
        // Add small delay between fixes
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }

  const getSeverityColor = (severity: Issue["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: Issue["status"]) => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case "fixed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const allFixed = issues.every((issue) => issue.status === "fixed")
  const hasFailures = issues.some((issue) => issue.status === "failed")

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Production Issues Fixer</h1>
        <p className="text-gray-600">Automatically detect and fix common production deployment issues</p>
      </div>

      <div className="mb-6">
        <Button onClick={fixAllIssues} className="mr-4">
          Fix All Issues
        </Button>

        {allFixed && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All issues have been resolved! Your application should be ready for production.
            </AlertDescription>
          </Alert>
        )}

        {hasFailures && (
          <Alert className="mt-4" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Some issues could not be automatically fixed. Please check the logs and fix them manually.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-4">
        {issues.map((issue) => (
          <Card key={issue.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(issue.status)}
                  <div>
                    <CardTitle className="text-lg">{issue.title}</CardTitle>
                    <CardDescription className={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()} PRIORITY
                    </CardDescription>
                  </div>
                </div>
                {issue.fix && issue.status === "pending" && (
                  <Button variant="outline" size="sm" onClick={() => fixIssue(issue)}>
                    Fix Now
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{issue.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Environment Variables Template</h3>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
          {`# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Optional Payment Variables (Server-side only)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Optional Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
WEBHOOK_SECRET=your_webhook_secret`}
        </pre>
      </div>
    </div>
  )
}

export { ProductionIssuesFixer }

// Main execution
if (require.main === module) {
  const fixer = new ProductionIssuesFixer()
  fixer.executeAllFixes().catch(console.error)
}
