import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/hooks/use-auth"
import { ClientGuard } from "@/components/client-guard"
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

// Force dynamic rendering for pages under the (main) segment that rely on
// server APIs or cookies during rendering.
export const dynamic = "force-dynamic"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientGuard>
            <div className="min-h-screen grid grid-cols-1 md:grid-cols-[256px_1fr]">
              {/* Persistent Sidebar */}
              <aside className="hidden md:block border-r bg-background">
                <AppSidebar />
              </aside>

              {/* Main content area */}
              <main className="flex-1 overflow-auto">{children}</main>
            </div>

            <Toaster />
          </ClientGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
