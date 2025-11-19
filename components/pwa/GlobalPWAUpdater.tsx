"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, RefreshCw } from "lucide-react"
import { monitoring } from "@/lib/monitoring"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function GlobalPWAUpdater() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show install banner after 30 seconds to avoid interrupting user
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallBanner(true)
        }
      }, 30000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
      monitoring.logUserAction("pwa_installed", {}, undefined)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Register service worker only in production or when explicitly enabled
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true")
    ) {
      registerServiceWorker()
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [isInstalled])

  const registerServiceWorker = async () => {
    try {
      // Check if sw.js exists and has correct MIME type
      const swResponse = await fetch("/sw.js", { method: "HEAD" })
      const contentType = swResponse.headers.get("content-type")

      if (!swResponse.ok) {
        console.log("Service worker not found, skipping registration")
        return
      }

      if (!contentType || !contentType.includes("javascript")) {
        console.log("Service worker has incorrect MIME type, skipping registration")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      setRegistration(registration)

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        }
      })

      monitoring.logUserAction("sw_registered", {}, undefined)
    } catch (error) {
      // Silently handle SW registration errors to avoid breaking the app
      console.log("Service worker registration failed:", error)
      monitoring.logError(error as Error, { action: "sw_registration" }, undefined)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        monitoring.logUserAction("pwa_install_accepted", {}, undefined)
      } else {
        monitoring.logUserAction("pwa_install_dismissed", {}, undefined)
      }

      setDeferredPrompt(null)
      setShowInstallBanner(false)
    } catch (error) {
      monitoring.logError(error as Error, { action: "pwa_install" }, undefined)
    }
  }

  const handleUpdateClick = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
      window.location.reload()
    }
  }

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    monitoring.logUserAction("pwa_banner_dismissed", {}, undefined)
  }

  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Update Available</p>
                <p className="text-sm text-blue-700">A new version is ready to install</p>
              </div>
              <Button onClick={handleUpdateClick} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showInstallBanner && !isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Install Mahakavya</p>
                <p className="text-sm text-orange-700">Get the full app experience</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleInstallClick} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Install
                </Button>
                <Button onClick={dismissInstallBanner} variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
