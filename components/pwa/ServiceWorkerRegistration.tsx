"use client"

import { useEffect } from "react"
import { monitor } from "@/lib/monitoring"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && window.workbox !== undefined) {
      const wb = window.workbox

      // Add event listeners to handle any of the generated workbox events
      wb.addEventListener("controlling", () => {
        window.location.reload()
      })

      wb.addEventListener("waiting", () => {
        // Show update available notification
        console.log("Service worker update available")
      })

      wb.addEventListener("installed", (event) => {
        if (event.isUpdate) {
          console.log("Service worker updated")
        } else {
          console.log("Service worker installed")
        }
      })

      wb.register()
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          monitor.info("Service Worker registered", {
            scope: registration.scope,
          })
        })
        .catch((error) => {
          monitor.error("Service Worker registration failed", {
            error: error.message,
          })
        })
    }
  }, [])

  return null
}
