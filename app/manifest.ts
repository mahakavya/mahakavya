import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mahakavya Social",
    short_name: "Mahakavya",
    description: "A comprehensive social platform for community engagement, fundraising, and support",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Feed",
        short_name: "Feed",
        description: "View your social feed",
        url: "/feed",
        icons: [{ src: "/icons/shortcut-feed.png", sizes: "96x96" }],
      },
      {
        name: "Chat",
        short_name: "Chat",
        description: "Open chat conversations",
        url: "/chat",
        icons: [{ src: "/icons/shortcut-chat.png", sizes: "96x96" }],
      },
      {
        name: "Donate",
        short_name: "Donate",
        description: "Make a donation",
        url: "/campaigns",
        icons: [{ src: "/icons/shortcut-donate.png", sizes: "96x96" }],
      },
      {
        name: "Reels",
        short_name: "Reels",
        description: "Watch video reels",
        url: "/reels",
        icons: [{ src: "/icons/shortcut-reels.png", sizes: "96x96" }],
      },
    ],
  }
}
