import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { TopBar } from "@/components/top-bar"
import { AppSidebar } from "@/components/app-sidebar"
import { GlobalBillingAlerts } from "@/lib/alerts"
import GlobalPWAUpdater from "@/components/pwa/GlobalPWAUpdater"
import InstallBanner from "@/components/pwa/InstallBanner"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mahakavya Social - Connect, Create, Contribute",
  description:
    "A vibrant social platform for connecting with others, creating content, and contributing to meaningful causes.",
  keywords: ["social media", "community", "fundraising", "emotional support", "content creation"],
  authors: [{ name: "Mahakavya Team" }],
  // themeColor moved to `viewport` export for Next.js compatibility
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mahakavya",
  },
  openGraph: {
    title: "Mahakavya Social",
    description: "Connect, Create, Contribute to our vibrant community",
    url: "https://mahakavya.social",
    siteName: "Mahakavya Social",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mahakavya Social",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahakavya Social",
    description: "Connect, Create, Contribute to our vibrant community",
    images: ["/og-image.png"],
  },
}

export const viewport = {
  themeColor: "#ff6a00",
}

// Force dynamic rendering for all pages under the (shell) segment.
// Many pages under this segment call server APIs that read cookies; marking
// the layout as force-dynamic prevents Next from attempting static prerender
// which otherwise triggers `Dynamic server usage` errors during export.
export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[256px_1fr]">
          {/* Sidebar - hidden on mobile, shown on desktop */}
          <aside className="hidden md:block">
            <AppSidebar />
          </aside>

          {/* Main content area */}
          <div className="flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 p-4 md:p-8">{children}</main>
          </div>
        </div>

        <Toaster />
        <GlobalBillingAlerts />
        <GlobalPWAUpdater />
        <InstallBanner />
      </body>
    </html>
  )
}
