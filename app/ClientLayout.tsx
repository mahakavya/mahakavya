"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "@/app/ClientProviders"
import { AIContextProvider } from "@/components/ai/AIContextProvider"
import { AISidebar } from "@/components/ai/AISidebar"
import { AIFloatingButton } from "@/components/ai/AIFloatingButton"
import GlobalPWAUpdater from "@/components/pwa/GlobalPWAUpdater"
import InstallBanner from "@/components/pwa/InstallBanner"
import { useState } from "react"

const inter = Inter({ subsets: ["latin"] })

function AIWrapper({ children }: { children: React.ReactNode }) {
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false)

  return (
    <>
      {children}
      <AIFloatingButton onClick={() => setIsAISidebarOpen(!isAISidebarOpen)} isActive={isAISidebarOpen} />
      <AISidebar isOpen={isAISidebarOpen} onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)} />
    </>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProviders>
          <AIContextProvider>
            <AIWrapper>{children}</AIWrapper>
          </AIContextProvider>
          <GlobalPWAUpdater />
          <InstallBanner />
        </ClientProviders>
      </body>
    </html>
  )
}
