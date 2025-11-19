import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientProviders } from "@/app/ClientProviders"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Mahakavya - Sacred Digital Heritage Platform",
    template: "%s | Mahakavya",
  },
  description:
    "A comprehensive digital platform celebrating Indian cultural heritage through AI, blockchain, and community engagement.",
  keywords: ["Indian culture", "heritage", "spiritual", "community", "AI", "blockchain"],
  authors: [{ name: "Mahakavya Team" }],
  creator: "Mahakavya",
  publisher: "Mahakavya",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://mahakavya.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Mahakavya - Sacred Digital Heritage Platform",
    description:
      "A comprehensive digital platform celebrating Indian cultural heritage through AI, blockchain, and community engagement.",
    siteName: "Mahakavya",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mahakavya - Sacred Digital Heritage Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahakavya - Sacred Digital Heritage Platform",
    description:
      "A comprehensive digital platform celebrating Indian cultural heritage through AI, blockchain, and community engagement.",
    images: ["/og-image.jpg"],
    creator: "@mahakavya",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f59e0b" },
    { media: "(prefers-color-scheme: dark)", color: "#d97706" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
  <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  )
}
