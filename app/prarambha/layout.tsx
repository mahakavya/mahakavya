import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Prarambha - Mahakavya Social Platform | Where Ancient Wisdom Meets Modern Innovation",
  description:
    "Welcome to Mahakavya's Prarambha - the landing page for our revolutionary social platform that bridges Sanskrit heritage with cutting-edge AI, Blockchain, and RPA technologies. Join a community that values authenticity, creativity, and meaningful impact.",
  keywords: [
    "Mahakavya",
    "Prarambha",
    "Sanskrit social platform",
    "AI social network",
    "Blockchain social media",
    "Cultural heritage platform",
    "Indian social platform",
    "Sanskrit technology",
    "Ancient wisdom modern innovation",
    "Community platform",
  ],
  authors: [{ name: "Mahakavya Team" }],
  creator: "Mahakavya",
  publisher: "Mahakavya",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Prarambha - Mahakavya Social Platform",
    description:
      "Where Ancient Wisdom Meets Modern Innovation. Join our AI-powered social platform that honors Sanskrit heritage.",
    url: "https://mahakavya.social/prarambha",
    siteName: "Mahakavya",
    images: [
      {
        url: "/og-prarambha.jpg",
        width: 1200,
        height: 630,
        alt: "Mahakavya Prarambha - Sanskrit Social Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prarambha - Mahakavya Social Platform",
    description: "Where Ancient Wisdom Meets Modern Innovation. Join our AI-powered social platform.",
    images: ["/twitter-prarambha.jpg"],
    creator: "@mahakavya_social",
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
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://mahakavya.social/prarambha",
    languages: {
      "en-US": "https://mahakavya.social/prarambha",
      "hi-IN": "https://mahakavya.social/hi/prarambha",
      "sa-IN": "https://mahakavya.social/sa/prarambha",
    },
  },
}

export default function PrarambhaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Prarambha - Mahakavya Social Platform",
            description:
              "Landing page for Mahakavya's revolutionary social platform that bridges Sanskrit heritage with modern technology.",
            url: "https://mahakavya.social/prarambha",
            isPartOf: {
              "@type": "WebSite",
              name: "Mahakavya",
              url: "https://mahakavya.social",
            },
            about: {
              "@type": "SoftwareApplication",
              name: "Mahakavya",
              applicationCategory: "Social Networking",
              operatingSystem: "Web, iOS, Android",
              description: "AI-powered social platform honoring Sanskrit heritage",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
            },
            mainEntity: {
              "@type": "Organization",
              name: "Mahakavya",
              description: "Revolutionary social platform bridging ancient wisdom with modern innovation",
              url: "https://mahakavya.social",
              logo: "https://mahakavya.social/logo.png",
              sameAs: [
                "https://twitter.com/mahakavya_social",
                "https://linkedin.com/company/mahakavya",
                "https://github.com/mahakavya",
              ],
            },
          }),
        }}
      />
      {children}
    </>
  )
}
