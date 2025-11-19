"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, X, Smartphone, Monitor, Zap } from "lucide-react"
import { monitoring } from "@/lib/monitoring"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface InstallBannerProps {
  className?: string
  variant?: "banner" | "card" | "modal"
  showFeatures?: boolean
}

export default function InstallBanner({ className = "", variant = "banner", showFeatures = true }: InstallBannerProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkInstalled()
    checkIOS()

    // PWA install prompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Show banner after a delay if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowBanner(true)
        }
      }, 3000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // App installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setShowBanner(false)
      setInstallPrompt(null)
      monitoring.logUserAction("app_installed")
    })

    // For iOS, show banner after delay if not installed
    if (isIOS && !isInstalled) {
      setTimeout(() => {
        setShowBanner(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [isInstalled, isIOS])

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice

        monitoring.logUserAction("install_prompt_response", { outcome })

        if (outcome === "accepted") {
          setShowBanner(false)
        }

        setInstallPrompt(null)
      } catch (error) {
        monitoring.logError(error as Error, { context: "PWA install prompt failed" })
      }
    }
  }

  const dismissBanner = () => {
    setShowBanner(false)
    monitoring.logUserAction("install_banner_dismissed")

    // Don't show again for 24 hours
    localStorage.setItem("installBannerDismissed", Date.now().toString())
  }

  // Check if banner was recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("installBannerDismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed)
      const dayInMs = 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < dayInMs) {
        setShowBanner(false)
        return
      }
    }
  }, [])

  if (isInstalled || !showBanner) {
    return null
  }

  const features = [
    {
      icon: <Zap className="h-4 w-4" />,
      text: "Faster loading",
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      text: "Works offline",
    },
    {
      icon: <Monitor className="h-4 w-4" />,
      text: "Native experience",
    },
  ]

  if (variant === "banner") {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-medium">Install Mahakavya App</p>
              {showFeatures && <p className="text-sm text-blue-100">Get the full experience with offline access</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {installPrompt ? (
              <Button
                onClick={handleInstall}
                variant="secondary"
                size="sm"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Install
              </Button>
            ) : isIOS ? (
              <div className="text-sm text-blue-100">
                Tap <span className="font-mono">⎘</span> then "Add to Home Screen"
              </div>
            ) : null}
            <Button variant="ghost" size="sm" onClick={dismissBanner} className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <Card className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Install Mahakavya</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissBanner}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            Get the best experience with our progressive web app
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {showFeatures && (
            <div className="flex items-center space-x-4 mb-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-1 text-sm text-blue-700">
                  {feature.icon}
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex space-x-2">
            {installPrompt ? (
              <Button onClick={handleInstall} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            ) : isIOS ? (
              <div className="flex-1 p-2 text-sm text-blue-700 bg-blue-100 rounded border">
                Tap <span className="font-mono font-bold">⎘</span> in Safari, then "Add to Home Screen"
              </div>
            ) : (
              <div className="flex-1 p-2 text-sm text-gray-600 bg-gray-100 rounded border">
                Install option will appear when available
              </div>
            )}
            <Button
              variant="outline"
              onClick={dismissBanner}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
