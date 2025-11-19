import { existsSync } from "fs"

interface PageRoute {
  route: string
  heritageName: string
  description: string
  access: string
  category: string
}

const routes: PageRoute[] = [
  // Admin & Control Panel
  {
    route: "/niyantrana",
    heritageName: "Niyantrana",
    description: "Admin dashboard",
    access: "Admin+",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/users",
    heritageName: "User Management",
    description: "View/edit users",
    access: "Admin+",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/content",
    heritageName: "Content Control",
    description: "Moderate posts, reels",
    access: "Admin+",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/fundraisers",
    heritageName: "Fundraising Admin",
    description: "Approve/flag campaigns",
    access: "Admin+",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/analytics",
    heritageName: "Vivechana",
    description: "Usage, engagement, subscriptions",
    access: "Super Admin+",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/settings",
    heritageName: "Niyantrana Setup",
    description: "Platform-wide configurations",
    access: "Master Admin only",
    category: "Admin & Control Panel",
  },
  {
    route: "/niyantrana/ai",
    heritageName: "AI Insights",
    description: "Copilot logs, AI flags, moderation reports",
    access: "Super Admin+",
    category: "Admin & Control Panel",
  },

  // Core Pages
  {
    route: "/prarambha",
    heritageName: "Prarambha",
    description: "Landing/Home page",
    access: "Public",
    category: "Core Pages",
  },
  {
    route: "/sanketa/signin",
    heritageName: "Sanketa - Signin",
    description: "User login",
    access: "Public",
    category: "Core Pages",
  },
  {
    route: "/sanketa/signup",
    heritageName: "Sanketa - Signup",
    description: "User registration",
    access: "Public",
    category: "Core Pages",
  },
  {
    route: "/yojana",
    heritageName: "Yojana",
    description: "Subscription plans + payments",
    access: "All Users",
    category: "Core Pages",
  },
  {
    route: "/parichaya/:id",
    heritageName: "Parichaya",
    description: "User profile",
    access: "All Users",
    category: "Core Pages",
  },
  {
    route: "/settings",
    heritageName: "Sthapana",
    description: "Theme, language, privacy, notifications",
    access: "All Users",
    category: "Core Pages",
  },

  // Social & Content
  {
    route: "/samvaaha",
    heritageName: "Samvaaha",
    description: "Social feed: posts, comments, likes",
    access: "All Users",
    category: "Social & Content",
  },
  {
    route: "/drishya",
    heritageName: "Drishya",
    description: "Reels: vertical short-form videos",
    access: "All Users",
    category: "Social & Content",
  },
  {
    route: "/varta",
    heritageName: "Varta",
    description: "Chat/Messaging system",
    access: "All Users",
    category: "Social & Content",
  },
  {
    route: "/varta/groups",
    heritageName: "Varta Groups",
    description: "Group conversations",
    access: "Premium Only",
    category: "Social & Content",
  },

  // Emotional Support
  {
    route: "/sahaya",
    heritageName: "Sahaya",
    description: "AI-guided or anonymous support",
    access: "Premium Only",
    category: "Emotional Support",
  },
  {
    route: "/sahaya/sessions",
    heritageName: "Sahaya Sessions",
    description: "Scheduled 1-on-1 calls with listeners",
    access: "Premium Only",
    category: "Emotional Support",
  },

  // Fundraising & Rewards
  {
    route: "/nivedana",
    heritageName: "Nivedana",
    description: "List of fundraisers",
    access: "All Users",
    category: "Fundraising & Rewards",
  },
  {
    route: "/nivedana/create",
    heritageName: "Nivedana Nirmana",
    description: "Start a fundraising campaign",
    access: "Premium Only",
    category: "Fundraising & Rewards",
  },
  {
    route: "/nivedana/:id",
    heritageName: "Nivedana Detail",
    description: "Fundraiser page",
    access: "All Users",
    category: "Fundraising & Rewards",
  },
  {
    route: "/bhagyachakra",
    heritageName: "BhagyaChakra",
    description: "Lucky draw game",
    access: "Premium Only",
    category: "Fundraising & Rewards",
  },

  // Optional & Support Pages
  {
    route: "/terms",
    heritageName: "Terms of Use",
    description: "Legal",
    access: "All Users",
    category: "Optional & Support Pages",
  },
  {
    route: "/privacy",
    heritageName: "Privacy Policy",
    description: "Legal",
    access: "All Users",
    category: "Optional & Support Pages",
  },
  {
    route: "/help",
    heritageName: "Help Center",
    description: "FAQs and support info",
    access: "All Users",
    category: "Optional & Support Pages",
  },
  {
    route: "/contact",
    heritageName: "Contact Us",
    description: "Inquiry form + team info",
    access: "All Users",
    category: "Optional & Support Pages",
  },
  {
    route: "/404",
    heritageName: "Not Found",
    description: "Custom heritage 404 page",
    access: "All Users",
    category: "Optional & Support Pages",
  },
]

interface PageStatus {
  route: string
  heritageName: string
  status: "IMPLEMENTED" | "PARTIAL" | "MISSING" | "REDIRECTED"
  actualPath?: string
  notes: string
  priority: "HIGH" | "MEDIUM" | "LOW"
}

function checkPageStatus(): PageStatus[] {
  const results: PageStatus[] = []

  for (const route of routes) {
    let status: PageStatus["status"] = "MISSING"
    let actualPath = ""
    let notes = ""
    let priority: PageStatus["priority"] = "MEDIUM"

    // Map heritage routes to actual implementation paths
    const routeMapping: Record<string, string> = {
      "/prarambha": "app/page.tsx",
      "/sanketa/signin": "app/login/page.tsx",
      "/sanketa/signup": "app/signup/page.tsx",
      "/yojana": "app/(shell)/yojana/page.tsx",
      "/parichaya/:id": "app/(shell)/profile/[id]/page.tsx",
      "/settings": "app/(shell)/settings/page.tsx",
      "/samvaaha": "app/(shell)/samvaaha/page.tsx",
      "/drishya": "app/(shell)/drishya/page.tsx",
      "/varta": "app/(shell)/varta/page.tsx",
      "/varta/groups": "app/(shell)/varta/groups/page.tsx",
      "/sahaya": "app/(shell)/sahaya/page.tsx",
      "/sahaya/sessions": "app/(shell)/sahaya/sessions/page.tsx",
      "/nivedana": "app/(shell)/nivedana/page.tsx",
      "/nivedana/create": "app/(shell)/nivedana/create/page.tsx",
      "/nivedana/:id": "app/(shell)/nivedana/[id]/page.tsx",
      "/bhagyachakra": "app/(shell)/bhagyachakra/page.tsx",
      "/niyantrana": "app/(shell)/admin/overview/page.tsx",
      "/niyantrana/users": "app/(shell)/admin/users/page.tsx",
      "/niyantrana/content": "app/(shell)/admin/moderation/page.tsx",
      "/niyantrana/fundraisers": "app/(shell)/admin/fundraisers/page.tsx",
      "/niyantrana/analytics": "app/(shell)/admin/analytics/page.tsx",
      "/niyantrana/settings": "app/(shell)/admin/settings/page.tsx",
      "/niyantrana/ai": "app/(shell)/admin/ai/page.tsx",
      "/404": "app/not-found.tsx",
      "/terms": "app/(shell)/legal/terms/page.tsx",
      "/privacy": "app/(shell)/legal/privacy/page.tsx",
      "/help": "app/(shell)/help/page.tsx",
      "/contact": "app/(shell)/contact/page.tsx",
    }

    // Check if the mapped file exists
    const mappedPath = routeMapping[route.route]
    if (mappedPath && existsSync(mappedPath)) {
      status = "IMPLEMENTED"
      actualPath = mappedPath
      notes = "Fully implemented"
    } else if (mappedPath) {
      // Check for alternative implementations
      const alternativePaths = [
        mappedPath.replace("/page.tsx", ".tsx"),
        mappedPath.replace("/(shell)/", "/"),
        mappedPath.replace("/[id]/", "/"),
      ]

      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          status = "IMPLEMENTED"
          actualPath = altPath
          notes = "Implemented with different structure"
          break
        }
      }
    }

    // Special cases and redirects
    if (route.route === "/prarambha" && existsSync("app/page.tsx")) {
      status = "REDIRECTED"
      actualPath = "app/page.tsx"
      notes = "Landing page implemented as root page"
    }

    if (route.route.startsWith("/niyantrana") && existsSync("app/(shell)/admin/overview/page.tsx")) {
      if (route.route === "/niyantrana") {
        status = "REDIRECTED"
        actualPath = "app/(shell)/admin/overview/page.tsx"
        notes = "Admin dashboard redirects to overview"
      }
    }

    // Check for settings pages
    if (route.route === "/settings") {
      if (
        existsSync("app/(shell)/settings/notifications/page.tsx") ||
        existsSync("app/(shell)/settings/privacy/page.tsx")
      ) {
        status = "PARTIAL"
        actualPath = "app/(shell)/settings/"
        notes = "Settings sections implemented, main page may need creation"
      }
    }

    // Set priority based on category and access level
    if (route.category === "Core Pages" || route.access === "Public") {
      priority = "HIGH"
    } else if (route.category === "Admin & Control Panel") {
      priority = "LOW"
    } else {
      priority = "MEDIUM"
    }

    results.push({
      route: route.route,
      heritageName: route.heritageName,
      status,
      actualPath,
      notes,
      priority,
    })
  }

  return results
}

function generateStatusReport(): string {
  const results = checkPageStatus()
  const categories = [...new Set(routes.map((r) => r.category))]

  let report = "# 📊 MAHAKAVYA PAGE DEVELOPMENT STATUS REPORT\n\n"

  // Summary statistics
  const implemented = results.filter((r) => r.status === "IMPLEMENTED").length
  const partial = results.filter((r) => r.status === "PARTIAL").length
  const missing = results.filter((r) => r.status === "MISSING").length
  const redirected = results.filter((r) => r.status === "REDIRECTED").length
  const total = results.length

  report += `## 📈 OVERALL STATUS\n\n`
  report += `- **Total Pages**: ${total}\n`
  report += `- **✅ Implemented**: ${implemented} (${Math.round((implemented / total) * 100)}%)\n`
  report += `- **🔄 Redirected**: ${redirected} (${Math.round((redirected / total) * 100)}%)\n`
  report += `- **⚠️ Partial**: ${partial} (${Math.round((partial / total) * 100)}%)\n`
  report += `- **❌ Missing**: ${missing} (${Math.round((missing / total) * 100)}%)\n\n`
  report += `**Development Completion: ${Math.round(((implemented + redirected + partial) / total) * 100)}%**\n\n`

  // Category breakdown
  for (const category of categories) {
    const categoryRoutes = results.filter((r) => routes.find((route) => route.route === r.route)?.category === category)
    const categoryImplemented = categoryRoutes.filter(
      (r) => r.status === "IMPLEMENTED" || r.status === "REDIRECTED",
    ).length

    report += `## 📂 ${category.toUpperCase()}\n\n`
    report += `**Status: ${categoryImplemented}/${categoryRoutes.length} Complete (${Math.round((categoryImplemented / categoryRoutes.length) * 100)}%)**\n\n`

    for (const result of categoryRoutes) {
      const statusIcon = {
        IMPLEMENTED: "✅",
        REDIRECTED: "🔄",
        PARTIAL: "⚠️",
        MISSING: "❌",
      }[result.status]

      const priorityIcon = {
        HIGH: "🔥",
        MEDIUM: "📋",
        LOW: "📝",
      }[result.priority]

      report += `### ${statusIcon} ${result.route} - ${result.heritageName} ${priorityIcon}\n`
      report += `- **Status**: ${result.status}\n`
      if (result.actualPath) {
        report += `- **File**: \`${result.actualPath}\`\n`
      }
      report += `- **Notes**: ${result.notes}\n\n`
    }
  }

  // Action items
  report += `## 🎯 PRIORITY ACTION ITEMS\n\n`

  const highPriorityMissing = results.filter((r) => r.priority === "HIGH" && r.status === "MISSING")
  const mediumPriorityMissing = results.filter((r) => r.priority === "MEDIUM" && r.status === "MISSING")

  if (highPriorityMissing.length > 0) {
    report += `### 🔥 HIGH PRIORITY (${highPriorityMissing.length} items)\n\n`
    for (const item of highPriorityMissing) {
      report += `- **${item.route}** (${item.heritageName})\n`
    }
    report += "\n"
  }

  if (mediumPriorityMissing.length > 0) {
    report += `### 📋 MEDIUM PRIORITY (${mediumPriorityMissing.length} items)\n\n`
    for (const item of mediumPriorityMissing) {
      report += `- **${item.route}** (${item.heritageName})\n`
    }
    report += "\n"
  }

  return report
}

// Run the analysis
console.log(generateStatusReport())

export { checkPageStatus, generateStatusReport }
